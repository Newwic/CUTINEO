import { GoogleGenerativeAI } from '@google/generative-ai';
import { MODEL_CATALOG, normalizePlanId, type AIFeature, type SupportedModel } from '@/core/billing/catalog';
import { estimateCostThb } from '@/core/billing/usage';
import { canUseAIFeature } from '@/core/billing/entitlements';

export type AIProviderId = 'gemini' | 'openai';

export interface AIRouterRequest {
  feature: AIFeature;
  provider?: AIProviderId;
  plan?: string;
  prompt: string;
  systemInstruction?: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface AIRouterResponse {
  text: string;
  provider: AIProviderId;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  estimatedCostThb: number;
}

const DEFAULT_MODEL: SupportedModel = 'gemini-2.5-flash';

function configuredProvider(): AIProviderId | null {
  const value = process.env.AI_DEFAULT_PROVIDER?.trim().toLowerCase();
  if (value === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (value === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
}

function availableProviders(preferred?: AIProviderId): AIProviderId[] {
  const providers: AIProviderId[] = [];
  if (process.env.GEMINI_API_KEY) providers.push('gemini');
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  const configured = preferred ?? configuredProvider();
  return configured ? [configured, ...providers.filter((provider) => provider !== configured)] : providers;
}

function chooseModel(request: AIRouterRequest, provider: AIProviderId): SupportedModel {
  const requested = request.model?.trim() as SupportedModel | undefined;
  if (requested && MODEL_CATALOG[requested]?.provider === provider) return requested;
  if (provider === 'openai' && process.env.OPENAI_MODEL && MODEL_CATALOG[process.env.OPENAI_MODEL as SupportedModel]?.provider === 'openai') {
    return process.env.OPENAI_MODEL as SupportedModel;
  }
  if (provider === 'gemini' && process.env.GEMINI_MODEL && MODEL_CATALOG[process.env.GEMINI_MODEL as SupportedModel]?.provider === 'gemini') {
    return process.env.GEMINI_MODEL as SupportedModel;
  }
  return provider === 'openai' ? 'gpt-4o-mini' : DEFAULT_MODEL;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

async function generateWithGemini(request: AIRouterRequest, modelName: SupportedModel): Promise<AIRouterResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini provider is not configured');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: request.systemInstruction,
    generationConfig: {
      temperature: request.temperature ?? 0.2,
      maxOutputTokens: request.maxOutputTokens ?? 512,
    },
  });
  const history = (request.history ?? []).map((item) => ({
    role: item.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: item.text }],
  }));
  const result = await model.startChat({ history }).sendMessage(request.prompt);
  const usage = result.response.usageMetadata;
  const inputTokens = usage?.promptTokenCount ?? estimateTokens(request.prompt);
  const outputTokens = usage?.candidatesTokenCount ?? estimateTokens(result.response.text());
  const cachedTokens = usage?.cachedContentTokenCount ?? 0;
  return {
    text: result.response.text().trim(),
    provider: 'gemini',
    model: modelName,
    inputTokens,
    outputTokens,
    cachedTokens,
    estimatedCostThb: estimateCostThb(modelName, inputTokens, outputTokens, cachedTokens),
  };
}

async function generateWithOpenAI(request: AIRouterRequest, modelName: SupportedModel): Promise<AIRouterResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI provider is not configured');
  const messages = [
    ...(request.systemInstruction ? [{ role: 'system', content: request.systemInstruction }] : []),
    ...(request.history ?? []).map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.text })),
    { role: 'user', content: request.prompt },
  ];
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelName, messages, temperature: request.temperature ?? 0.2, max_tokens: request.maxOutputTokens ?? 512 }),
  });
  if (!response.ok) throw new Error(`OpenAI provider returned ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  const text = payload.choices?.[0]?.message?.content?.trim() ?? '';
  const inputTokens = payload.usage?.prompt_tokens ?? estimateTokens(request.prompt);
  const outputTokens = payload.usage?.completion_tokens ?? estimateTokens(text);
  return {
    text,
    provider: 'openai',
    model: modelName,
    inputTokens,
    outputTokens,
    cachedTokens: 0,
    estimatedCostThb: estimateCostThb(modelName, inputTokens, outputTokens),
  };
}

/** AI Gateway entry point. Business code selects a feature; the router selects provider/model. */
export async function routeAIRequest(request: AIRouterRequest): Promise<AIRouterResponse> {
  const plan = normalizePlanId(request.plan);
  if (!canUseAIFeature(plan, request.feature)) throw new Error(`AI feature ${request.feature} is not included in plan ${plan}`);
  const providers = availableProviders(request.provider);
  if (providers.length === 0) throw new Error('No AI provider is configured');
  let lastError: unknown;
  for (const provider of providers) {
    try {
      const modelName = chooseModel({ ...request, plan }, provider);
      if (provider === 'openai') return await generateWithOpenAI(request, modelName);
      return await generateWithGemini(request, modelName);
    } catch (error) {
      lastError = error;
      console.error(`[CUTINEO AI] ${provider} provider failed; trying the next available provider`, error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All AI providers failed');
}
