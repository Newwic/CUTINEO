/** Safe customer-facing responses. Kept in this client-safe module so the
 * static demo does not import the server-only pricing/system prompt catalog. */
export const NEO_SECURITY_REFUSAL =
  'ขออภัยครับ Neo ได้รับการออกแบบมาเพื่อดูแลและให้ข้อมูลระบบ CUTINEO เท่านั้นครับ หากคุณลูกค้าสนใจระบบรวมแชทหรือ AI ช่วยปิดการขาย สามารถสอบถามได้เลยครับ';

export const NEO_TECHNICAL_RESPONSE =
  'ระบบของเราทำงานบนโครงสร้าง Cloud ความปลอดภัยสูงระดับสากล พร้อมมาตรฐานการคุ้มครองข้อมูล PDPA ครับ';

export type NeoPolicyRoute = 'scope_refusal' | 'technical_safe_response';

export interface NeoPolicyDecision {
  route: NeoPolicyRoute;
  reply: string;
}

const scopeEscapePatterns: RegExp[] = [
  /ignore\s+(?:all\s+)?(?:previous|prior|system|developer)?\s*(?:instructions?|rules?)/i,
  /disregard\s+(?:all\s+)?(?:previous|prior|system|developer)?\s*(?:instructions?|rules?)/i,
  /forget\s+(?:all\s+)?(?:previous|prior|system|developer)?\s*(?:instructions?|rules?)/i,
  /\b(?:dan|developer\s*mode|jailbreak(?:\s*mode)?)\b/i,
  /ลืม(?:คำสั่ง|กฎ)(?:ทั้งหมด|ก่อนหน้า)?/u,
  /(?:ไม่ต้องสนใจ|ข้าม|ยกเลิก|เขียนทับ)(?:คำสั่ง|กฎ|ข้อกำหนด)/u,
  /(?:ขอดู|แสดง|เปิดเผย).*(?:system\s*prompt|developer\s*prompt|prompt|คำสั่งลับ|กฎภายใน)/iu,
  /(?:show|reveal|print|share).*(?:system\s*prompt|hidden\s*(?:config|instructions?)|developer\s*rules?)/i,
  /(?:เขียน|คำนวณ)\s*(?:โค้ด|code)|(?:รัน|สั่งรัน)\s*(?:คำสั่ง|คำสั่ง\s*OS)|(?:powershell|terminal|shell)\s*คำสั่ง/iu,
  /\b(?:write|calculate|run|execute)\s+(?:code|commands?|powershell|shell|OS)\b/i,
  /\b(?:tell|write)\s+(?:me\s+)?(?:a\s+)?(?:story|joke)|\b(?:swear|use\s+profanity)\b/i,
  /(?:พิมพ์|พูด|แต่ง|เล่า).*(?:คำหยาบ|เรื่องนอกบริบท|นิยาย|เรื่องผี)/iu,
];

const technicalPatterns: RegExp[] = [
  /(?:api\s*key|secret\s*token|access\s*token|private\s*key|credentials?)/i,
  /(?:supabase|database|db|sql)\s*(?:schema|structure|config|configuration)/i,
  /(?:โครงสร้าง|schema|รายละเอียด).*(?:ฐานข้อมูล|database|เซิร์ฟเวอร์|server|หลังบ้าน)/iu,
  /(?:คีย์ลับ|โทเค็นลับ|ข้อมูลลับ|รหัสลับ|ซอร์สโค้ด|โค้ดฝั่งเซิร์ฟเวอร์)/u,
  /(?:ชื่อ|รายชื่อ).*(?:ซอฟต์แวร์|เครื่องมือ).*(?:ภายใน|หลังบ้าน)/u,
  /(?:reverse\s*engineer|เจาะระบบ|แฮ็ก|hack|server\s*config|backend\s*config)/i,
];

function normalizeInput(value: string): string {
  return value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

/**
 * Detect policy-breaking requests before they reach the model. This is a
 * deterministic first line of defense; the same rules are repeated in the
 * model instruction because conversation history and tenant KB are untrusted.
 */
export function getNeoPolicyDecision(value: string): NeoPolicyDecision | null {
  const input = normalizeInput(value);
  if (!input) return null;

  if (matchesAny(input, scopeEscapePatterns)) {
    return { route: 'scope_refusal', reply: NEO_SECURITY_REFUSAL };
  }

  if (matchesAny(input, technicalPatterns)) {
    return { route: 'technical_safe_response', reply: NEO_TECHNICAL_RESPONSE };
  }

  return null;
}

export function getNeoPolicyReply(value: string): string | null {
  return getNeoPolicyDecision(value)?.reply ?? null;
}
