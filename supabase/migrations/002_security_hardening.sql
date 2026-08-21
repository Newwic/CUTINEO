-- CUTINEO security hardening
-- Apply this migration after 001_initial_schema.sql.
-- Existing orphan rows or cross-tenant references intentionally fail validation
-- instead of being silently repaired.

CREATE UNIQUE INDEX IF NOT EXISTS channels_tenant_id_id_uq
  ON public.channels(tenant_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_tenant_id_id_uq
  ON public.contacts(tenant_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_tenant_id_id_uq
  ON public.conversations(tenant_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS messages_tenant_id_id_uq
  ON public.messages(tenant_id, id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_channel_same_tenant_fk'
      AND conrelid = 'public.conversations'::regclass
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_channel_same_tenant_fk
      FOREIGN KEY (tenant_id, channel_id)
      REFERENCES public.channels(tenant_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_contact_same_tenant_fk'
      AND conrelid = 'public.conversations'::regclass
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_contact_same_tenant_fk
      FOREIGN KEY (tenant_id, contact_id)
      REFERENCES public.contacts(tenant_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_conversation_same_tenant_fk'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_conversation_same_tenant_fk
      FOREIGN KEY (tenant_id, conversation_id)
      REFERENCES public.conversations(tenant_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'identities_channel_same_tenant_fk'
      AND conrelid = 'public.channel_identities'::regclass
  ) THEN
    ALTER TABLE public.channel_identities
      ADD CONSTRAINT identities_channel_same_tenant_fk
      FOREIGN KEY (tenant_id, channel_id)
      REFERENCES public.channels(tenant_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'identities_contact_same_tenant_fk'
      AND conrelid = 'public.channel_identities'::regclass
  ) THEN
    ALTER TABLE public.channel_identities
      ADD CONSTRAINT identities_contact_same_tenant_fk
      FOREIGN KEY (tenant_id, contact_id)
      REFERENCES public.contacts(tenant_id, id)
      NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.conversations
  VALIDATE CONSTRAINT conversations_channel_same_tenant_fk;
ALTER TABLE public.conversations
  VALIDATE CONSTRAINT conversations_contact_same_tenant_fk;
ALTER TABLE public.messages
  VALIDATE CONSTRAINT messages_conversation_same_tenant_fk;
ALTER TABLE public.channel_identities
  VALIDATE CONSTRAINT identities_channel_same_tenant_fk;
ALTER TABLE public.channel_identities
  VALIDATE CONSTRAINT identities_contact_same_tenant_fk;

DO $$
BEGIN
  CREATE TYPE public.webhook_job_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.webhook_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  message_id UUID NOT NULL,
  status public.webhook_job_status_enum NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_jobs_message_id_uq
  ON public.webhook_jobs(message_id);

CREATE INDEX IF NOT EXISTS webhook_jobs_claim_idx
  ON public.webhook_jobs(status, available_at, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'webhook_jobs_channel_same_tenant_fk'
      AND conrelid = 'public.webhook_jobs'::regclass
  ) THEN
    ALTER TABLE public.webhook_jobs
      ADD CONSTRAINT webhook_jobs_channel_same_tenant_fk
      FOREIGN KEY (tenant_id, channel_id)
      REFERENCES public.channels(tenant_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'webhook_jobs_conversation_same_tenant_fk'
      AND conrelid = 'public.webhook_jobs'::regclass
  ) THEN
    ALTER TABLE public.webhook_jobs
      ADD CONSTRAINT webhook_jobs_conversation_same_tenant_fk
      FOREIGN KEY (tenant_id, conversation_id)
      REFERENCES public.conversations(tenant_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'webhook_jobs_message_same_tenant_fk'
      AND conrelid = 'public.webhook_jobs'::regclass
  ) THEN
    ALTER TABLE public.webhook_jobs
      ADD CONSTRAINT webhook_jobs_message_same_tenant_fk
      FOREIGN KEY (tenant_id, message_id)
      REFERENCES public.messages(tenant_id, id)
      NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.webhook_jobs
  VALIDATE CONSTRAINT webhook_jobs_channel_same_tenant_fk;
ALTER TABLE public.webhook_jobs
  VALIDATE CONSTRAINT webhook_jobs_conversation_same_tenant_fk;
ALTER TABLE public.webhook_jobs
  VALIDATE CONSTRAINT webhook_jobs_message_same_tenant_fk;

DROP TRIGGER IF EXISTS webhook_jobs_set_updated_at ON public.webhook_jobs;
CREATE TRIGGER webhook_jobs_set_updated_at
BEFORE UPDATE ON public.webhook_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_tenant_admin(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members
    WHERE tenant_id = target_tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_tenant_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_tenant_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members
    WHERE tenant_id = target_tenant_id
      AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_tenant_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_tenant_member(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID) TO authenticated;

ALTER TABLE public.webhook_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_member_access ON public.contacts;
DROP POLICY IF EXISTS contacts_member_select ON public.contacts;
DROP POLICY IF EXISTS contacts_admin_write ON public.contacts;
CREATE POLICY contacts_member_select ON public.contacts
FOR SELECT TO authenticated
USING (public.is_tenant_member(tenant_id));
CREATE POLICY contacts_admin_write ON public.contacts
FOR ALL TO authenticated
USING (public.is_tenant_admin(tenant_id))
WITH CHECK (public.is_tenant_admin(tenant_id));

DROP POLICY IF EXISTS identities_member_access ON public.channel_identities;
DROP POLICY IF EXISTS identities_member_select ON public.channel_identities;
DROP POLICY IF EXISTS identities_admin_write ON public.channel_identities;
CREATE POLICY identities_member_select ON public.channel_identities
FOR SELECT TO authenticated
USING (public.is_tenant_member(tenant_id));
CREATE POLICY identities_admin_write ON public.channel_identities
FOR ALL TO authenticated
USING (public.is_tenant_admin(tenant_id))
WITH CHECK (public.is_tenant_admin(tenant_id));

DROP POLICY IF EXISTS conversations_member_access ON public.conversations;
DROP POLICY IF EXISTS conversations_member_select ON public.conversations;
CREATE POLICY conversations_member_select ON public.conversations
FOR SELECT TO authenticated
USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS messages_member_access ON public.messages;
DROP POLICY IF EXISTS messages_member_select ON public.messages;
DROP POLICY IF EXISTS messages_agent_insert ON public.messages;
CREATE POLICY messages_member_select ON public.messages
FOR SELECT TO authenticated
USING (public.is_tenant_member(tenant_id));
CREATE POLICY messages_agent_insert ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  public.is_tenant_member(tenant_id)
  AND sender_type = 'human_agent'
  AND sender_id = auth.uid()::TEXT
  AND message_type IN ('text', 'internal_note')
);

DROP POLICY IF EXISTS knowledge_bases_member_access ON public.knowledge_bases;
DROP POLICY IF EXISTS knowledge_bases_member_select ON public.knowledge_bases;
DROP POLICY IF EXISTS knowledge_bases_admin_write ON public.knowledge_bases;
CREATE POLICY knowledge_bases_member_select ON public.knowledge_bases
FOR SELECT TO authenticated
USING (public.is_tenant_member(tenant_id));
CREATE POLICY knowledge_bases_admin_write ON public.knowledge_bases
FOR ALL TO authenticated
USING (public.is_tenant_admin(tenant_id))
WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE OR REPLACE FUNCTION public.claim_webhook_jobs(p_limit INTEGER DEFAULT 10)
RETURNS SETOF public.webhook_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.webhook_jobs
    WHERE (
      status = 'pending'
      AND available_at <= NOW()
    ) OR (
      status = 'processing'
      AND locked_at < NOW() - INTERVAL '5 minutes'
      AND attempts < 5
    )
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50)
  )
  UPDATE public.webhook_jobs AS jobs
  SET
    status = 'processing',
    attempts = jobs.attempts + 1,
    locked_at = NOW(),
    updated_at = NOW()
  FROM candidates
  WHERE jobs.id = candidates.id
  RETURNING jobs.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webhook_jobs(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_webhook_jobs(INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_jobs(INTEGER) TO service_role;
