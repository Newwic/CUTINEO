-- CUTINEO Phase 1: canonical organizations, RBAC and tenant isolation.
--
-- This migration deliberately keeps the existing tenants/tenant_members tables
-- as a compatibility layer for the Inbox. New modules must use
-- organizations/organization_members and organization_id.

BEGIN;

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  legacy_tenant_id UUID UNIQUE REFERENCES public.tenants(id) ON DELETE SET NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL CHECK (scope IN ('platform', 'organization')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL REFERENCES public.roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

INSERT INTO public.roles (id, display_name, description, scope, permissions)
VALUES
  ('platform_owner', 'Platform Owner', 'ดูแล CUTINEO ทุก Organization', 'platform', '["platform:read", "platform:write"]'::jsonb),
  ('company_owner', 'Company Owner', 'เจ้าของข้อมูลของบริษัท', 'organization', '["organization:read", "organization:write", "stock:write", "audit:read"]'::jsonb),
  ('admin', 'Admin', 'ผู้ดูแลข้อมูลและสมาชิกของบริษัท', 'organization', '["organization:read", "organization:write", "stock:write", "audit:read"]'::jsonb),
  ('warehouse', 'Warehouse', 'รับเข้า เบิกออก โอน และปรับสต็อก', 'organization', '["organization:read", "stock:read", "stock:write"]'::jsonb),
  ('viewer', 'Viewer', 'ดูข้อมูลอย่างเดียว', 'organization', '["organization:read", "stock:read"]'::jsonb),
  -- Legacy Inbox role. It has no Stock permission and is retained only while
  -- existing Inbox users are migrated to the new role model.
  ('agent', 'Legacy Inbox Agent', 'ผู้ปฏิบัติงาน Inbox เดิม', 'organization', '["organization:read", "inbox:write"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  scope = EXCLUDED.scope,
  permissions = EXCLUDED.permissions;

-- RPV is the first Organization. If the old tenant already exists, reuse its
-- UUID so current Inbox rows and the new Stock boundary remain joinable.
INSERT INTO public.tenants (name, plan, settings)
SELECT 'RPV Industrial Supply Co., Ltd.', 'starter', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants
  WHERE LOWER(name) = LOWER('RPV Industrial Supply Co., Ltd.')
);

INSERT INTO public.users (id, email, display_name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name'),
  au.created_at,
  COALESCE(au.updated_at, au.created_at)
FROM auth.users AS au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
  updated_at = NOW();

INSERT INTO public.organizations (
  id, name, slug, legacy_tenant_id, settings, created_at, updated_at
)
SELECT
  t.id,
  t.name,
  COALESCE(NULLIF(REGEXP_REPLACE(LOWER(t.name), '[^a-z0-9]+', '-', 'g'), ''), 'organization')
    || '-' || LEFT(t.id::TEXT, 8),
  t.id,
  t.settings,
  t.created_at,
  t.updated_at
FROM public.tenants AS t
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  legacy_tenant_id = EXCLUDED.legacy_tenant_id,
  settings = EXCLUDED.settings,
  updated_at = NOW();

UPDATE public.organizations AS o
SET slug = 'rpv-industrial-supply', updated_at = NOW()
WHERE o.legacy_tenant_id = (
  SELECT t.id FROM public.tenants AS t
  WHERE LOWER(t.name) = LOWER('RPV Industrial Supply Co., Ltd.')
  ORDER BY t.created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.organizations AS existing
  WHERE existing.slug = 'rpv-industrial-supply'
    AND existing.id <> o.id
);

INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT
  tm.tenant_id,
  tm.user_id,
  CASE tm.role
    WHEN 'owner' THEN 'company_owner'
    WHEN 'admin' THEN 'admin'
    WHEN 'viewer' THEN 'viewer'
    ELSE 'agent'
  END
FROM public.tenant_members AS tm
JOIN public.organizations AS o ON o.id = tm.tenant_id
JOIN public.users AS u ON u.id = tm.user_id
ON CONFLICT (organization_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE OR REPLACE FUNCTION public.set_organization_from_legacy_boundary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  legacy_id TEXT;
BEGIN
  legacy_id := to_jsonb(NEW) ->> TG_ARGV[0];
  IF legacy_id IS NOT NULL THEN
    NEW.organization_id := legacy_id::UUID;
  ELSIF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required for %', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$;

-- Existing business tables use tenant_id or company_id. Keep their public API
-- compatible while enforcing one canonical organization_id on every write.
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.channel_identities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.knowledge_bases ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.webhook_jobs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.billing_cycles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_boosts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_usage_daily ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_usage_alerts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.channels SET organization_id = tenant_id WHERE organization_id IS NULL;
UPDATE public.contacts SET organization_id = tenant_id WHERE organization_id IS NULL;
UPDATE public.channel_identities SET organization_id = tenant_id WHERE organization_id IS NULL;
UPDATE public.conversations SET organization_id = tenant_id WHERE organization_id IS NULL;
UPDATE public.messages SET organization_id = tenant_id WHERE organization_id IS NULL;
UPDATE public.knowledge_bases SET organization_id = tenant_id WHERE organization_id IS NULL;
UPDATE public.webhook_jobs SET organization_id = tenant_id WHERE organization_id IS NULL;
UPDATE public.subscriptions SET organization_id = company_id WHERE organization_id IS NULL;
UPDATE public.billing_cycles SET organization_id = company_id WHERE organization_id IS NULL;
UPDATE public.ai_boosts SET organization_id = company_id WHERE organization_id IS NULL;
UPDATE public.ai_usage SET organization_id = company_id WHERE organization_id IS NULL;
UPDATE public.ai_usage_daily SET organization_id = company_id WHERE organization_id IS NULL;
UPDATE public.ai_usage_alerts SET organization_id = company_id WHERE organization_id IS NULL;
UPDATE public.audit_logs SET organization_id = company_id WHERE organization_id IS NULL;

ALTER TABLE public.channels ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.contacts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.channel_identities ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.knowledge_bases ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.webhook_jobs ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.billing_cycles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.ai_boosts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.ai_usage ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.ai_usage_daily ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.ai_usage_alerts ALTER COLUMN organization_id SET NOT NULL;

DROP TRIGGER IF EXISTS channels_set_organization_id ON public.channels;
CREATE TRIGGER channels_set_organization_id
BEFORE INSERT OR UPDATE ON public.channels
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('tenant_id');

DROP TRIGGER IF EXISTS contacts_set_organization_id ON public.contacts;
CREATE TRIGGER contacts_set_organization_id
BEFORE INSERT OR UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('tenant_id');

DROP TRIGGER IF EXISTS channel_identities_set_organization_id ON public.channel_identities;
CREATE TRIGGER channel_identities_set_organization_id
BEFORE INSERT OR UPDATE ON public.channel_identities
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('tenant_id');

DROP TRIGGER IF EXISTS conversations_set_organization_id ON public.conversations;
CREATE TRIGGER conversations_set_organization_id
BEFORE INSERT OR UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('tenant_id');

DROP TRIGGER IF EXISTS messages_set_organization_id ON public.messages;
CREATE TRIGGER messages_set_organization_id
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('tenant_id');

DROP TRIGGER IF EXISTS knowledge_bases_set_organization_id ON public.knowledge_bases;
CREATE TRIGGER knowledge_bases_set_organization_id
BEFORE INSERT OR UPDATE ON public.knowledge_bases
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('tenant_id');

DROP TRIGGER IF EXISTS webhook_jobs_set_organization_id ON public.webhook_jobs;
CREATE TRIGGER webhook_jobs_set_organization_id
BEFORE INSERT OR UPDATE ON public.webhook_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('tenant_id');

DROP TRIGGER IF EXISTS subscriptions_set_organization_id ON public.subscriptions;
CREATE TRIGGER subscriptions_set_organization_id
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('company_id');

DROP TRIGGER IF EXISTS billing_cycles_set_organization_id ON public.billing_cycles;
CREATE TRIGGER billing_cycles_set_organization_id
BEFORE INSERT OR UPDATE ON public.billing_cycles
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('company_id');

DROP TRIGGER IF EXISTS ai_boosts_set_organization_id ON public.ai_boosts;
CREATE TRIGGER ai_boosts_set_organization_id
BEFORE INSERT OR UPDATE ON public.ai_boosts
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('company_id');

DROP TRIGGER IF EXISTS ai_usage_set_organization_id ON public.ai_usage;
CREATE TRIGGER ai_usage_set_organization_id
BEFORE INSERT OR UPDATE ON public.ai_usage
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('company_id');

DROP TRIGGER IF EXISTS ai_usage_daily_set_organization_id ON public.ai_usage_daily;
CREATE TRIGGER ai_usage_daily_set_organization_id
BEFORE INSERT OR UPDATE ON public.ai_usage_daily
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('company_id');

DROP TRIGGER IF EXISTS ai_usage_alerts_set_organization_id ON public.ai_usage_alerts;
CREATE TRIGGER ai_usage_alerts_set_organization_id
BEFORE INSERT OR UPDATE ON public.ai_usage_alerts
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('company_id');

DROP TRIGGER IF EXISTS audit_logs_set_organization_id ON public.audit_logs;
CREATE TRIGGER audit_logs_set_organization_id
BEFORE INSERT OR UPDATE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.set_organization_from_legacy_boundary('company_id');

CREATE INDEX IF NOT EXISTS organizations_active_idx
  ON public.organizations(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS organization_members_user_idx
  ON public.organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS organization_members_org_role_idx
  ON public.organization_members(organization_id, role);
CREATE INDEX IF NOT EXISTS audit_logs_organization_created_idx
  ON public.audit_logs(organization_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_organization_member(target_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = target_organization_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_organization_admin(target_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = target_organization_id
      AND user_id = auth.uid()
      AND role IN ('company_owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.is_organization_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_organization_member(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.is_organization_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_organization_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.is_platform_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_platform_owner() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated;

-- Existing RLS policies call these compatibility helpers. Repointing them to
-- organization_members makes the canonical membership table authoritative.
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_organization_member(target_tenant_id);
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_organization_admin(target_tenant_id);
$$;

REVOKE ALL ON FUNCTION public.is_tenant_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_tenant_member(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.is_tenant_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_tenant_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID) TO authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_member_select ON public.organizations;
CREATE POLICY organizations_member_select ON public.organizations
FOR SELECT TO authenticated
USING (public.is_organization_member(id) OR public.is_platform_owner());

DROP POLICY IF EXISTS organizations_admin_update ON public.organizations;
CREATE POLICY organizations_admin_update ON public.organizations
FOR UPDATE TO authenticated
USING (public.is_organization_admin(id) OR public.is_platform_owner())
WITH CHECK (public.is_organization_admin(id) OR public.is_platform_owner());

DROP POLICY IF EXISTS users_org_select ON public.users;
CREATE POLICY users_org_select ON public.users
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.organization_members AS viewer_membership
    JOIN public.organization_members AS target_membership
      ON target_membership.organization_id = viewer_membership.organization_id
    WHERE viewer_membership.user_id = auth.uid()
      AND target_membership.user_id = users.id
  )
  OR public.is_platform_owner()
);

DROP POLICY IF EXISTS roles_authenticated_select ON public.roles;
CREATE POLICY roles_authenticated_select ON public.roles
FOR SELECT TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS organization_members_select ON public.organization_members;
CREATE POLICY organization_members_select ON public.organization_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_organization_member(organization_id)
  OR public.is_platform_owner()
);

DROP POLICY IF EXISTS organization_members_admin_write ON public.organization_members;
CREATE POLICY organization_members_admin_write ON public.organization_members
FOR ALL TO authenticated
USING (public.is_organization_admin(organization_id) OR public.is_platform_owner())
WITH CHECK (public.is_organization_admin(organization_id) OR public.is_platform_owner());

DROP POLICY IF EXISTS audit_logs_organization_select ON public.audit_logs;
CREATE POLICY audit_logs_organization_select ON public.audit_logs
FOR SELECT TO authenticated
USING (
  (organization_id IS NOT NULL AND public.is_organization_member(organization_id))
  OR public.is_platform_owner()
);

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

REVOKE UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

DROP TRIGGER IF EXISTS organizations_set_updated_at ON public.organizations;
CREATE TRIGGER organizations_set_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS organization_members_set_updated_at ON public.organization_members;
CREATE TRIGGER organization_members_set_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
