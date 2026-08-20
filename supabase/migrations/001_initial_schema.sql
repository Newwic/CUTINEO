CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE TYPE channel_platform_enum AS ENUM ('line', 'facebook', 'tiktok', 'wechat');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE conversation_status_enum AS ENUM ('open', 'pending_human', 'resolved', 'spam');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE assigned_entity_enum AS ENUM ('ai_agent', 'human_agent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE message_sender_enum AS ENUM ('customer', 'ai_agent', 'human_agent', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file', 'order_card', 'internal_note');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  settings JSONB NOT NULL DEFAULT '{"ai_auto_reply": true, "ai_model": "gemini-2.5-flash"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform channel_platform_enum NOT NULL,
  platform_channel_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, platform_channel_id)
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  avatar_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  platform_user_id VARCHAR(255) NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel_id, platform_user_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status conversation_status_enum NOT NULL DEFAULT 'open',
  assigned_to assigned_entity_enum NOT NULL DEFAULT 'ai_agent',
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel_id, contact_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type message_sender_enum NOT NULL,
  sender_id VARCHAR(255),
  message_type message_type_enum NOT NULL DEFAULT 'text',
  content TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  platform_message_id VARCHAR(255),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_platform_id
  ON messages(platform_message_id)
  WHERE platform_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_members_user
  ON tenant_members(user_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_channels_tenant
  ON channels(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant
  ON contacts(tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_identities_search
  ON channel_identities(channel_id, platform_user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_lookup
  ON conversations(tenant_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_contact
  ON conversations(channel_id, contact_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_history
  ON messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_knowledge_bases_tenant
  ON knowledge_bases(tenant_id, is_active, created_at ASC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_set_updated_at ON tenants;
CREATE TRIGGER tenants_set_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS channels_set_updated_at ON channels;
CREATE TRIGGER channels_set_updated_at
BEFORE UPDATE ON channels
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS contacts_set_updated_at ON contacts;
CREATE TRIGGER contacts_set_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS conversations_set_updated_at ON conversations;
CREATE TRIGGER conversations_set_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS knowledge_bases_set_updated_at ON knowledge_bases;
CREATE TRIGGER knowledge_bases_set_updated_at
BEFORE UPDATE ON knowledge_bases
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION is_tenant_member(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenant_members
    WHERE tenant_id = target_tenant_id
      AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION is_tenant_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_tenant_member(UUID) TO anon, authenticated;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_member_select ON tenants;
CREATE POLICY tenants_member_select ON tenants
FOR SELECT TO authenticated
USING (is_tenant_member(id));

DROP POLICY IF EXISTS tenant_members_self_select ON tenant_members;
CREATE POLICY tenant_members_self_select ON tenant_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_tenant_member(tenant_id));

DROP POLICY IF EXISTS channels_member_select ON channels;
CREATE POLICY channels_member_select ON channels
FOR SELECT TO authenticated
USING (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS contacts_member_access ON contacts;
CREATE POLICY contacts_member_access ON contacts
FOR ALL TO authenticated
USING (is_tenant_member(tenant_id))
WITH CHECK (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS identities_member_access ON channel_identities;
CREATE POLICY identities_member_access ON channel_identities
FOR ALL TO authenticated
USING (is_tenant_member(tenant_id))
WITH CHECK (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS conversations_member_access ON conversations;
CREATE POLICY conversations_member_access ON conversations
FOR ALL TO authenticated
USING (is_tenant_member(tenant_id))
WITH CHECK (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS messages_member_access ON messages;
CREATE POLICY messages_member_access ON messages
FOR ALL TO authenticated
USING (is_tenant_member(tenant_id))
WITH CHECK (is_tenant_member(tenant_id));

DROP POLICY IF EXISTS knowledge_bases_member_access ON knowledge_bases;
CREATE POLICY knowledge_bases_member_access ON knowledge_bases
FOR ALL TO authenticated
USING (is_tenant_member(tenant_id))
WITH CHECK (is_tenant_member(tenant_id));

-- Credentials are consumed by server-side webhook/API code only. The browser
-- should use channel_directory, which deliberately omits the credentials field.
REVOKE SELECT (credentials) ON TABLE channels FROM anon, authenticated;
GRANT SELECT (id, tenant_id, platform, platform_channel_id, name, is_active, created_at, updated_at)
  ON TABLE channels TO authenticated;

DROP VIEW IF EXISTS channel_directory;
CREATE VIEW channel_directory
WITH (security_invoker = true)
AS
SELECT id, tenant_id, platform, platform_channel_id, name, is_active, created_at, updated_at
FROM channels;

GRANT SELECT ON channel_directory TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'conversations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
  END IF;
END
$$;
