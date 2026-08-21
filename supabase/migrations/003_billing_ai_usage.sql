-- CUTINEO billing, entitlement and AI usage ledger.
-- Backward-compatible: the existing tenants table remains the company/tenant
-- boundary and all old conversations/messages stay untouched.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan_id TEXT;

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price_thb NUMERIC(12, 2),
  price_range TEXT,
  ai_message_limit INTEGER NOT NULL CHECK (ai_message_limit >= 0),
  max_admins INTEGER CHECK (max_admins IS NULL OR max_admins > 0),
  max_channels INTEGER CHECK (max_channels IS NULL OR max_channels > 0),
  chat_history_days INTEGER CHECK (chat_history_days IS NULL OR chat_history_days > 0),
  positioning TEXT NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plan_features (
  plan_id TEXT NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  entitlement TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (plan_id, feature_key)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled')),
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_live_per_company
  ON public.subscriptions(company_id)
  WHERE status IN ('trialing', 'active', 'past_due');

CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, starts_at)
);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_cycle_id UUID REFERENCES public.billing_cycles(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS scheduled_plan_id TEXT REFERENCES public.plans(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS scheduled_change_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS custom_ai_message_limit INTEGER CHECK (custom_ai_message_limit IS NULL OR custom_ai_message_limit > 0);
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS custom_monthly_price_thb NUMERIC(12, 2) CHECK (custom_monthly_price_thb IS NULL OR custom_monthly_price_thb >= 0);
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS scheduled_custom_ai_message_limit INTEGER CHECK (scheduled_custom_ai_message_limit IS NULL OR scheduled_custom_ai_message_limit > 0);
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS scheduled_custom_monthly_price_thb NUMERIC(12, 2) CHECK (scheduled_custom_monthly_price_thb IS NULL OR scheduled_custom_monthly_price_thb >= 0);

ALTER TABLE public.billing_cycles
  ADD COLUMN IF NOT EXISTS ai_message_limit INTEGER CHECK (ai_message_limit IS NULL OR ai_message_limit >= 0);

CREATE TABLE IF NOT EXISTS public.ai_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  billing_cycle_id UUID NOT NULL REFERENCES public.billing_cycles(id) ON DELETE CASCADE,
  sku TEXT NOT NULL DEFAULT 'ai_boost_20k',
  message_limit INTEGER NOT NULL DEFAULT 20000 CHECK (message_limit > 0),
  price_thb NUMERIC(12, 2) NOT NULL DEFAULT 490,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'refunded', 'cancelled')),
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_reference TEXT,
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID,
  billing_cycle_id UUID REFERENCES public.billing_cycles(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  feature TEXT NOT NULL CHECK (feature IN ('chat_reply', 'faq', 'product_answer', 'sales_memory', 'follow_up', 'summary', 'quotation', 'recommendation')),
  input_tokens INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  cached_tokens INTEGER NOT NULL DEFAULT 0 CHECK (cached_tokens >= 0),
  estimated_cost NUMERIC(14, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  message_count INTEGER NOT NULL DEFAULT 1 CHECK (message_count > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  billing_cycle_id UUID REFERENCES public.billing_cycles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  input_tokens BIGINT NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens BIGINT NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  cached_tokens BIGINT NOT NULL DEFAULT 0 CHECK (cached_tokens >= 0),
  estimated_cost NUMERIC(14, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, billing_cycle_id, usage_date)
);

ALTER TABLE public.ai_usage_daily
  ADD COLUMN IF NOT EXISTS request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0);

CREATE TABLE IF NOT EXISTS public.ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  secret_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  input_usd_per_million NUMERIC(12, 6) NOT NULL DEFAULT 0,
  output_usd_per_million NUMERIC(12, 6) NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'analyst')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  billing_cycle_id UUID NOT NULL REFERENCES public.billing_cycles(id) ON DELETE CASCADE,
  threshold_percent INTEGER NOT NULL CHECK (threshold_percent IN (70, 80, 90, 100)),
  message TEXT NOT NULL,
  owner_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, billing_cycle_id, threshold_percent)
);

CREATE INDEX IF NOT EXISTS ai_usage_company_cycle_idx
  ON public.ai_usage(company_id, billing_cycle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_cost_idx
  ON public.ai_usage(company_id, estimated_cost DESC);
CREATE INDEX IF NOT EXISTS ai_usage_daily_company_date_idx
  ON public.ai_usage_daily(company_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS ai_boosts_company_cycle_idx
  ON public.ai_boosts(company_id, billing_cycle_id, status);
CREATE INDEX IF NOT EXISTS billing_cycles_company_dates_idx
  ON public.billing_cycles(company_id, starts_at DESC, ends_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_company_created_idx
  ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_alerts_company_cycle_idx
  ON public.ai_usage_alerts(company_id, billing_cycle_id, threshold_percent);

INSERT INTO public.plans (id, name, monthly_price_thb, price_range, ai_message_limit, max_admins, max_channels, chat_history_days, positioning, is_custom)
VALUES
  ('starter', 'Starter', 490, NULL, 3000, 2, 2, 90, 'AI ช่วยตอบ', FALSE),
  ('pro', 'Pro', 990, NULL, 30000, 5, 5, NULL, 'AI ช่วยตอบ + จำ + ตาม + ขาย', FALSE),
  ('advanced', 'Advanced', 1990, NULL, 100000, 15, NULL, NULL, 'AI Sales Automation', FALSE),
  ('enterprise', 'Enterprise', NULL, '19,900 – 39,900+ บาท / เดือน', 300000, NULL, NULL, NULL, 'AI Platform สำหรับองค์กร', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price_thb = EXCLUDED.monthly_price_thb,
  price_range = EXCLUDED.price_range,
  ai_message_limit = EXCLUDED.ai_message_limit,
  max_admins = EXCLUDED.max_admins,
  max_channels = EXCLUDED.max_channels,
  chat_history_days = EXCLUDED.chat_history_days,
  positioning = EXCLUDED.positioning,
  is_custom = EXCLUDED.is_custom,
  updated_at = NOW();

INSERT INTO public.plan_features (plan_id, feature_key, entitlement)
SELECT 'starter', key, value FROM jsonb_each_text('{"ai_auto_reply":"true","faq":"basic","product_knowledge":"basic","sales_memory":"false","follow_up":"false","chat_summary":"false","product_recommendation":"false","quotation":"false","promptpay_qr":"false","slip_ocr":"false","order_booking":"false","customer_memory":"false","sales_pipeline":"false","automation":"basic","analytics":"basic","webhook":"false","api_access":"false","pos_integration":"false","erp_integration":"false","dedicated_onboarding":"false","security_audit":"false","priority_support":"false"}'::jsonb)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET entitlement = EXCLUDED.entitlement;

INSERT INTO public.plan_features (plan_id, feature_key, entitlement)
SELECT 'pro', key, value FROM jsonb_each_text('{"ai_auto_reply":"true","faq":"true","product_knowledge":"true","sales_memory":"true","follow_up":"true","chat_summary":"true","product_recommendation":"true","quotation":"basic","promptpay_qr":"true","slip_ocr":"true","order_booking":"true","customer_memory":"true","sales_pipeline":"false","automation":"standard","analytics":"standard","webhook":"false","api_access":"false","pos_integration":"false","erp_integration":"false","dedicated_onboarding":"false","security_audit":"false","priority_support":"false"}'::jsonb)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET entitlement = EXCLUDED.entitlement;

INSERT INTO public.plan_features (plan_id, feature_key, entitlement)
SELECT 'advanced', key, value FROM jsonb_each_text('{"ai_auto_reply":"true","faq":"true","product_knowledge":"true","sales_memory":"advanced","follow_up":"advanced","chat_summary":"true","product_recommendation":"advanced","quotation":"full","promptpay_qr":"true","slip_ocr":"true","order_booking":"true","customer_memory":"true","sales_pipeline":"true","automation":"advanced","analytics":"advanced","webhook":"true","api_access":"true","pos_integration":"false","erp_integration":"false","dedicated_onboarding":"false","security_audit":"false","priority_support":"false"}'::jsonb)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET entitlement = EXCLUDED.entitlement;

INSERT INTO public.plan_features (plan_id, feature_key, entitlement)
SELECT 'enterprise', key, value FROM jsonb_each_text('{"ai_auto_reply":"custom","faq":"custom","product_knowledge":"custom","sales_memory":"custom","follow_up":"custom","chat_summary":"custom","product_recommendation":"custom","quotation":"custom","promptpay_qr":"custom","slip_ocr":"custom","order_booking":"custom","customer_memory":"custom","sales_pipeline":"custom","automation":"custom","analytics":"custom","webhook":"custom","api_access":"custom","pos_integration":"true","erp_integration":"true","dedicated_onboarding":"true","security_audit":"true","priority_support":"true"}'::jsonb)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET entitlement = EXCLUDED.entitlement;

INSERT INTO public.ai_providers (id, name, is_enabled, secret_ref)
VALUES ('gemini', 'Google Gemini', TRUE, 'GEMINI_API_KEY'), ('openai', 'OpenAI', FALSE, 'OPENAI_API_KEY')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, secret_ref = EXCLUDED.secret_ref;

INSERT INTO public.ai_models (id, provider_id, display_name, input_usd_per_million, output_usd_per_million)
VALUES
  ('gemini-2.5-flash', 'gemini', 'Gemini 2.5 Flash', 0.30, 2.50),
  ('gpt-4o-mini', 'openai', 'GPT-4o mini', 0.15, 0.60)
ON CONFLICT (id) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  input_usd_per_million = EXCLUDED.input_usd_per_million,
  output_usd_per_million = EXCLUDED.output_usd_per_million;

UPDATE public.tenants
SET plan_id = CASE
  WHEN LOWER(COALESCE(plan, '')) IN ('pro', 'advanced', 'enterprise') THEN LOWER(plan)
  ELSE 'starter'
END
WHERE plan_id IS NULL OR plan_id NOT IN ('starter', 'pro', 'advanced', 'enterprise');

INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
SELECT
  t.id,
  COALESCE(t.plan_id, 'starter'),
  'active',
  DATE_TRUNC('month', NOW()),
  DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
FROM public.tenants AS t
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions AS existing
  WHERE existing.company_id = t.id
    AND existing.status IN ('trialing', 'active', 'past_due')
);

INSERT INTO public.billing_cycles (company_id, subscription_id, plan_id, ai_message_limit, starts_at, ends_at, status)
SELECT s.company_id, s.id, s.plan_id, COALESCE(s.custom_ai_message_limit, p.ai_message_limit), s.current_period_start, s.current_period_end, 'active'
FROM public.subscriptions AS s
JOIN public.plans AS p ON p.id = s.plan_id
WHERE s.status IN ('trialing', 'active', 'past_due')
  AND NOT EXISTS (
    SELECT 1 FROM public.billing_cycles AS c
    WHERE c.company_id = s.company_id AND c.starts_at = s.current_period_start
  );

UPDATE public.subscriptions AS s
SET current_cycle_id = c.id, updated_at = NOW()
FROM public.billing_cycles AS c
WHERE c.company_id = s.company_id
  AND c.starts_at = s.current_period_start
  AND s.current_cycle_id IS NULL;

UPDATE public.billing_cycles AS c
SET ai_message_limit = COALESCE(s.custom_ai_message_limit, p.ai_message_limit)
FROM public.subscriptions AS s
JOIN public.plans AS p ON p.id = s.plan_id
WHERE c.subscription_id = s.id
  AND c.ai_message_limit IS NULL;

CREATE OR REPLACE FUNCTION public.record_ai_usage(
  p_company_id UUID,
  p_user_id UUID,
  p_conversation_id UUID,
  p_billing_cycle_id UUID,
  p_provider TEXT,
  p_model TEXT,
  p_feature TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_cached_tokens INTEGER,
  p_estimated_cost NUMERIC,
  p_message_count INTEGER DEFAULT 1,
  p_created_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_id UUID;
  cycle_limit INTEGER;
  cycle_used INTEGER;
  threshold INTEGER;
BEGIN
  IF p_billing_cycle_id IS NOT NULL THEN
    PERFORM 1 FROM public.billing_cycles WHERE id = p_billing_cycle_id FOR UPDATE;

    SELECT COALESCE(c.ai_message_limit, p.ai_message_limit) + COALESCE(SUM(CASE WHEN b.status = 'active' THEN b.message_limit ELSE 0 END), 0)
    INTO cycle_limit
    FROM public.billing_cycles AS c
    JOIN public.plans AS p ON p.id = c.plan_id
    LEFT JOIN public.ai_boosts AS b ON b.company_id = c.company_id AND b.billing_cycle_id = c.id
    WHERE c.id = p_billing_cycle_id
    GROUP BY c.ai_message_limit, p.ai_message_limit;

    SELECT COALESCE(SUM(message_count), 0)
    INTO cycle_used
    FROM public.ai_usage
    WHERE company_id = p_company_id AND billing_cycle_id = p_billing_cycle_id;

    IF COALESCE(cycle_limit, 0) > 0 AND cycle_used + GREATEST(COALESCE(p_message_count, 1), 1) > cycle_limit THEN
      RAISE EXCEPTION 'AI quota exceeded' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  INSERT INTO public.ai_usage (
    company_id, user_id, conversation_id, billing_cycle_id, provider, model,
    feature, input_tokens, output_tokens, cached_tokens, estimated_cost,
    message_count, created_at
  ) VALUES (
    p_company_id, p_user_id, p_conversation_id, p_billing_cycle_id, p_provider, p_model,
    p_feature, GREATEST(COALESCE(p_input_tokens, 0), 0), GREATEST(COALESCE(p_output_tokens, 0), 0),
    GREATEST(COALESCE(p_cached_tokens, 0), 0), GREATEST(COALESCE(p_estimated_cost, 0), 0),
    GREATEST(COALESCE(p_message_count, 1), 1), COALESCE(p_created_at, NOW())
  ) RETURNING id INTO usage_id;

  IF p_billing_cycle_id IS NOT NULL THEN
    INSERT INTO public.ai_usage_daily (
      company_id, billing_cycle_id, usage_date, message_count,
      request_count, input_tokens, output_tokens, cached_tokens, estimated_cost, updated_at
    ) VALUES (
      p_company_id, p_billing_cycle_id, COALESCE(p_created_at, NOW())::DATE,
      GREATEST(COALESCE(p_message_count, 1), 1),
      1,
      GREATEST(COALESCE(p_input_tokens, 0), 0), GREATEST(COALESCE(p_output_tokens, 0), 0),
      GREATEST(COALESCE(p_cached_tokens, 0), 0), GREATEST(COALESCE(p_estimated_cost, 0), 0), NOW()
    )
    ON CONFLICT (company_id, billing_cycle_id, usage_date) DO UPDATE SET
      message_count = public.ai_usage_daily.message_count + EXCLUDED.message_count,
      request_count = public.ai_usage_daily.request_count + EXCLUDED.request_count,
      input_tokens = public.ai_usage_daily.input_tokens + EXCLUDED.input_tokens,
      output_tokens = public.ai_usage_daily.output_tokens + EXCLUDED.output_tokens,
      cached_tokens = public.ai_usage_daily.cached_tokens + EXCLUDED.cached_tokens,
      estimated_cost = public.ai_usage_daily.estimated_cost + EXCLUDED.estimated_cost,
      updated_at = NOW();

    SELECT COALESCE(c.ai_message_limit, p.ai_message_limit) + COALESCE(SUM(CASE WHEN b.status = 'active' THEN b.message_limit ELSE 0 END), 0)
    INTO cycle_limit
    FROM public.billing_cycles AS c
    JOIN public.plans AS p ON p.id = c.plan_id
    LEFT JOIN public.ai_boosts AS b ON b.company_id = c.company_id AND b.billing_cycle_id = c.id
    WHERE c.id = p_billing_cycle_id
    GROUP BY c.ai_message_limit, p.ai_message_limit;

    SELECT COALESCE(SUM(message_count), 0)
    INTO cycle_used
    FROM public.ai_usage
    WHERE company_id = p_company_id AND billing_cycle_id = p_billing_cycle_id;

    FOREACH threshold IN ARRAY ARRAY[70, 80, 90, 100] LOOP
      IF COALESCE(cycle_limit, 0) > 0 AND cycle_used * 100 >= cycle_limit * threshold THEN
        INSERT INTO public.ai_usage_alerts (company_id, billing_cycle_id, threshold_percent, message)
        VALUES (
          p_company_id,
          p_billing_cycle_id,
          threshold,
          CASE threshold
            WHEN 70 THEN 'AI Usage เริ่มสูงถึง 70%'
            WHEN 80 THEN 'AI Usage ถึง 80% กรุณาแจ้งเตือนเจ้าของบริษัท'
            WHEN 90 THEN 'AI Usage ใกล้หมดที่ 90%'
            ELSE 'AI Usage เต็ม 100% ระบบหยุด AI เพิ่มเติมตาม policy'
          END
        )
        ON CONFLICT (company_id, billing_cycle_id, threshold_percent) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN usage_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_ai_usage(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, NUMERIC, INTEGER, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ai_usage(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, NUMERIC, INTEGER, TIMESTAMPTZ) TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plans_authenticated_select ON public.plans;
CREATE POLICY plans_authenticated_select ON public.plans FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS plan_features_authenticated_select ON public.plan_features;
CREATE POLICY plan_features_authenticated_select ON public.plan_features FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS subscriptions_member_select ON public.subscriptions;
CREATE POLICY subscriptions_member_select ON public.subscriptions FOR SELECT TO authenticated USING (public.is_tenant_member(company_id));
DROP POLICY IF EXISTS billing_cycles_member_select ON public.billing_cycles;
CREATE POLICY billing_cycles_member_select ON public.billing_cycles FOR SELECT TO authenticated USING (public.is_tenant_member(company_id));
DROP POLICY IF EXISTS ai_boosts_member_select ON public.ai_boosts;
CREATE POLICY ai_boosts_member_select ON public.ai_boosts FOR SELECT TO authenticated USING (public.is_tenant_member(company_id));
DROP POLICY IF EXISTS ai_usage_member_select ON public.ai_usage;
CREATE POLICY ai_usage_member_select ON public.ai_usage FOR SELECT TO authenticated USING (public.is_tenant_member(company_id));
DROP POLICY IF EXISTS ai_usage_daily_member_select ON public.ai_usage_daily;
CREATE POLICY ai_usage_daily_member_select ON public.ai_usage_daily FOR SELECT TO authenticated USING (public.is_tenant_member(company_id));
DROP POLICY IF EXISTS ai_providers_authenticated_select ON public.ai_providers;
CREATE POLICY ai_providers_authenticated_select ON public.ai_providers FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS ai_models_authenticated_select ON public.ai_models;
CREATE POLICY ai_models_authenticated_select ON public.ai_models FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS audit_logs_member_select ON public.audit_logs;
CREATE POLICY audit_logs_member_select ON public.audit_logs FOR SELECT TO authenticated USING (company_id IS NOT NULL AND public.is_tenant_member(company_id));
DROP POLICY IF EXISTS ai_usage_alerts_member_select ON public.ai_usage_alerts;
CREATE POLICY ai_usage_alerts_member_select ON public.ai_usage_alerts FOR SELECT TO authenticated USING (public.is_tenant_member(company_id));

-- platform_admins has no authenticated policy: only service_role can manage/read it.
