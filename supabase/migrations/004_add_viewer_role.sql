BEGIN;

ALTER TABLE public.tenant_members
  DROP CONSTRAINT IF EXISTS tenant_members_role_check;

ALTER TABLE public.tenant_members
  ADD CONSTRAINT tenant_members_role_check
  CHECK (role IN ('owner', 'admin', 'agent', 'viewer'));

COMMIT;
