export type CutineoPlanId = 'starter' | 'pro' | 'advanced' | 'enterprise';

export type FeatureEntitlement = boolean | 'basic' | 'standard' | 'advanced' | 'full' | 'custom';

export type FeatureKey =
  | 'ai_auto_reply'
  | 'faq'
  | 'product_knowledge'
  | 'sales_memory'
  | 'follow_up'
  | 'chat_summary'
  | 'product_recommendation'
  | 'quotation'
  | 'promptpay_qr'
  | 'slip_ocr'
  | 'order_booking'
  | 'customer_memory'
  | 'sales_pipeline'
  | 'automation'
  | 'analytics'
  | 'webhook'
  | 'api_access'
  | 'pos_integration'
  | 'erp_integration'
  | 'dedicated_onboarding'
  | 'security_audit'
  | 'priority_support';

export interface PlanDefinition {
  id: CutineoPlanId;
  name: string;
  monthlyPriceThb: number | null;
  priceRange?: string;
  aiMessages: number;
  maxAdmins: number | null;
  maxChannels: number | null;
  chatHistoryDays: number | null;
  positioning: string;
  audience: string;
  featured?: boolean;
  features: Record<FeatureKey, FeatureEntitlement>;
  marketingFeatures: string[];
}

const starterFeatures: Record<FeatureKey, FeatureEntitlement> = {
  ai_auto_reply: true,
  faq: 'basic',
  product_knowledge: 'basic',
  sales_memory: false,
  follow_up: false,
  chat_summary: false,
  product_recommendation: false,
  quotation: false,
  promptpay_qr: false,
  slip_ocr: false,
  order_booking: false,
  customer_memory: false,
  sales_pipeline: false,
  automation: 'standard',
  analytics: 'standard',
  webhook: false,
  api_access: false,
  pos_integration: false,
  erp_integration: false,
  dedicated_onboarding: false,
  security_audit: false,
  priority_support: false,
};

const proFeatures: Record<FeatureKey, FeatureEntitlement> = {
  ...starterFeatures,
  faq: true,
  product_knowledge: true,
  sales_memory: true,
  follow_up: true,
  chat_summary: true,
  product_recommendation: true,
  quotation: 'basic',
  promptpay_qr: true,
  slip_ocr: true,
  order_booking: true,
  customer_memory: true,
  automation: 'basic',
  analytics: 'basic',
};

const advancedFeatures: Record<FeatureKey, FeatureEntitlement> = {
  ...proFeatures,
  sales_memory: 'advanced',
  follow_up: 'advanced',
  quotation: 'full',
  product_recommendation: 'advanced',
  automation: 'advanced',
  analytics: 'advanced',
  webhook: true,
  api_access: true,
  sales_pipeline: true,
};

const enterpriseFeatures: Record<FeatureKey, FeatureEntitlement> = {
  ...advancedFeatures,
  sales_memory: 'custom',
  follow_up: 'custom',
  quotation: 'custom',
  product_recommendation: 'custom',
  automation: 'custom',
  analytics: 'custom',
  webhook: 'custom',
  api_access: 'custom',
  pos_integration: true,
  erp_integration: true,
  dedicated_onboarding: true,
  security_audit: true,
  priority_support: true,
};

export const PLAN_ORDER: CutineoPlanId[] = ['starter', 'pro', 'advanced', 'enterprise'];

export const PLAN_CATALOG: Record<CutineoPlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPriceThb: 490,
    aiMessages: 3_000,
    maxAdmins: 2,
    maxChannels: 2,
    chatHistoryDays: 90,
    positioning: 'AI ช่วยตอบ',
    audience: 'ร้านเล็กที่ต้องการรวมแชทและทดลองใช้ AI ตอบลูกค้า',
    features: starterFeatures,
    marketingFeatures: [
      'AI Messages 3,000 / เดือน',
      'AI ตอบลูกค้าอัตโนมัติ + FAQ / Product Knowledge แบบ Basic',
      'Admin สูงสุด 2 คน · Channels สูงสุด 2 ช่องทาง',
      'Unified Inbox, Tags, Customer Status และ Basic Automation',
      'Chat History 90 วัน · Basic Analytics',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPriceThb: 990,
    aiMessages: 30_000,
    maxAdmins: 5,
    maxChannels: 5,
    chatHistoryDays: null,
    positioning: 'AI ช่วยตอบ + จำ + ตาม + ขาย',
    audience: 'ร้านค้าออนไลน์ที่ต้องการ AI ช่วยปิดการขาย',
    featured: true,
    features: proFeatures,
    marketingFeatures: [
      'AI Messages 30,000 / เดือน',
      'AI FAQ, Product Knowledge, Sales Memory และ Follow-up',
      'AI Chat Summary, Recommendation และ Quotation แบบ Basic',
      'PromptPay QR, Slip OCR, Order / Booking และ Customer Memory',
      'Admin สูงสุด 5 คน · Channels สูงสุด 5 ช่องทาง',
      'Chat History ไม่จำกัด · Standard Automation / Analytics',
    ],
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    monthlyPriceThb: 1_990,
    aiMessages: 100_000,
    maxAdmins: 15,
    maxChannels: null,
    chatHistoryDays: null,
    positioning: 'AI Sales Automation',
    audience: 'ธุรกิจที่มีข้อความจำนวนมากหรือมีทีมขายหลายคน',
    features: advancedFeatures,
    marketingFeatures: [
      'AI Messages 100,000 / เดือน',
      'ทุก AI Feature ของ Pro พร้อม Advanced Sales Memory / Follow-up',
      'Advanced Automation, Recommendation และ Full Quotation',
      'Sales Pipeline, Webhook และ API Access',
      'Admin สูงสุด 15 คน · รองรับ Channels มากกว่า Pro',
      'Unlimited Chat History · Advanced Analytics',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPriceThb: null,
    priceRange: '19,900 – 39,900+ บาท / เดือน',
    aiMessages: 300_000,
    maxAdmins: null,
    maxChannels: null,
    chatHistoryDays: null,
    positioning: 'AI Platform สำหรับองค์กร',
    audience: 'องค์กรที่ต้องการ Custom AI Workflow และ Integration',
    features: enterpriseFeatures,
    marketingFeatures: [
      'AI Messages 300,000 – 1,000,000+ / เดือน',
      'Custom Admin, Channels, AI Usage และ AI Workflow',
      'Custom API, POS / ERP Integration และ Enterprise Analytics',
      'Dedicated Onboarding · Security / Audit Features',
      'SLA 99.9%+ · Priority Support',
    ],
  },
};

export const AI_BOOST = {
  id: 'ai_boost_20k',
  name: 'AI Boost',
  priceThb: 490,
  messages: 20_000,
  description: '+20,000 AI Messages สำหรับ Billing Cycle ปัจจุบัน',
  eligiblePlans: ['starter', 'pro', 'advanced'] as CutineoPlanId[],
};

export const AI_FEATURES = [
  'chat_reply',
  'faq',
  'product_answer',
  'sales_memory',
  'follow_up',
  'summary',
  'quotation',
  'recommendation',
] as const;

export type AIFeature = (typeof AI_FEATURES)[number];

export const MODEL_CATALOG = {
  'gemini-2.5-flash': { provider: 'gemini', inputUsdPerMillion: 0.30, outputUsdPerMillion: 2.50 },
  'gpt-4o-mini': { provider: 'openai', inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.60 },
} as const;

export type SupportedModel = keyof typeof MODEL_CATALOG;

export const PUBLIC_PLAN_CARDS = PLAN_ORDER.map((id) => {
  const plan = PLAN_CATALOG[id];
  return {
    name: plan.name,
    description: plan.positioning,
    monthly: plan.monthlyPriceThb,
    priceLabel: plan.monthlyPriceThb === null ? 'Custom' : null,
    priceNote: plan.priceRange ?? '',
    suffix: '/เดือน',
    users: plan.maxAdmins === null ? 'Admin และ Channels แบบ Custom' : `Admin สูงสุด ${plan.maxAdmins} คน`,
    aiMessages: plan.aiMessages,
    features: plan.marketingFeatures,
    button: id === 'enterprise' ? 'คุยกับทีมขาย' : `เริ่มต้น ${plan.name}`,
    featured: Boolean(plan.featured),
  };
});

export function normalizePlanId(value: unknown): CutineoPlanId {
  const normalized = typeof value === 'string' ? value.toLowerCase().trim() : '';
  if (normalized === 'pro' || normalized === 'advanced' || normalized === 'enterprise') return normalized;
  return 'starter';
}

export function getPlanDefinition(value: unknown): PlanDefinition {
  return PLAN_CATALOG[normalizePlanId(value)];
}

export function isBoostEligible(value: unknown): boolean {
  return AI_BOOST.eligiblePlans.includes(normalizePlanId(value));
}

export function formatPlanPrice(planId: CutineoPlanId): string {
  const plan = PLAN_CATALOG[planId];
  return plan.monthlyPriceThb === null ? plan.priceRange ?? 'Custom' : `฿${plan.monthlyPriceThb.toLocaleString('th-TH')}`;
}
