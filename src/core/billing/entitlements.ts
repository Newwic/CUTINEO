import {
  getPlanDefinition,
  normalizePlanId,
  type CutineoPlanId,
  type FeatureEntitlement,
  type FeatureKey,
} from './catalog';
import type { AIFeature } from './catalog';

export interface CompanyEntitlements {
  planId: CutineoPlanId;
  aiMessages: number;
  maxAdmins: number | null;
  maxChannels: number | null;
  chatHistoryDays: number | null;
  features: Record<FeatureKey, FeatureEntitlement>;
}

/** Single permission source of truth for API and server-side AI decisions. */
export function getCompanyEntitlements(plan: unknown): CompanyEntitlements {
  const planId = normalizePlanId(plan);
  const definition = getPlanDefinition(planId);
  return {
    planId,
    aiMessages: definition.aiMessages,
    maxAdmins: definition.maxAdmins,
    maxChannels: definition.maxChannels,
    chatHistoryDays: definition.chatHistoryDays,
    features: definition.features,
  };
}

export function getFeatureEntitlement(plan: unknown, feature: FeatureKey): FeatureEntitlement {
  return getCompanyEntitlements(plan).features[feature];
}

export function canUseFeature(plan: unknown, feature: FeatureKey): boolean {
  return getFeatureEntitlement(plan, feature) !== false;
}

export function hasFeatureLevel(
  plan: unknown,
  feature: FeatureKey,
  accepted: FeatureEntitlement[],
): boolean {
  const value = getFeatureEntitlement(plan, feature);
  return accepted.includes(value);
}

const aiFeatureMap: Record<AIFeature, FeatureKey> = {
  chat_reply: 'ai_auto_reply',
  faq: 'faq',
  product_answer: 'product_knowledge',
  sales_memory: 'sales_memory',
  follow_up: 'follow_up',
  summary: 'chat_summary',
  quotation: 'quotation',
  recommendation: 'product_recommendation',
};

export function canUseAIFeature(plan: unknown, feature: AIFeature): boolean {
  return canUseFeature(plan, aiFeatureMap[feature]);
}
