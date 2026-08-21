# CUTINEO — AI Commerce Inbox

CUTINEO เป็นโครงสร้าง Omnichannel Social Commerce SaaS แบบ multi-tenant สำหรับรวมแชทลูกค้า ทีมขาย และ AI Agent ไว้ใน Unified Inbox เดียว

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS + Lucide React
- Supabase PostgreSQL + Auth + Realtime + Service Role API
- Upstash Redis สำหรับ deduplication ของ webhook
- Google Gemini Flash สำหรับ AI Agent
- LINE Messaging API adapter

## เริ่มรันในเครื่อง

พิมพ์อันนี้ครับ

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

เปิด `http://localhost:3000`

ถ้ายังไม่ใส่ environment ระบบจะแสดงหน้า configuration state แต่จะยังเชื่อมฐานข้อมูลหรือส่งข้อความจริงไม่ได้

## ตั้งค่า Supabase

1. สร้าง Supabase project
2. เปิด SQL Editor แล้วรันไฟล์ `supabase/migrations/001_initial_schema.sql`
3. เปิด Email Auth ใน Supabase Authentication
4. สร้างผู้ใช้และเพิ่มแถวใน `tenant_members` ให้ผู้ใช้นั้นเป็นสมาชิกของ tenant
5. ใส่ค่า Supabase URL, anon key และ service role key ใน `.env.local`

`SUPABASE_SERVICE_ROLE_KEY` ใช้เฉพาะฝั่ง server และห้ามใส่ในตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_`

## เชื่อม LINE

สร้าง channel ในตาราง `channels` โดยเก็บ credentials ฝั่ง server ในรูปแบบนี้:

```json
{
  "channelSecret": "LINE_CHANNEL_SECRET",
  "channelAccessToken": "LINE_CHANNEL_ACCESS_TOKEN"
}
```

ตั้ง Webhook URL ของ LINE เป็น:

```text
https://YOUR_DEPLOYMENT_DOMAIN/api/webhooks/line/YOUR_CHANNEL_UUID
```

ระบบจะตรวจ `x-line-signature`, กัน event ซ้ำด้วย Redis, บันทึก contact/conversation/message และเรียก Gemini เมื่อ conversation ถูก assign ให้ `ai_agent`

## คำสั่งตรวจสอบ

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Health endpoint:

```text
GET /api/health
```

## Deployment

Next.js API routes และ LINE webhook ต้องรันบน Node.js runtime เช่น Vercel, Render หรือเครื่อง Node server จึงจะทำงานครบ ฟีเจอร์ API/Webhook ไม่สามารถรันบน GitHub Pages ได้

สำหรับ Vercel:

1. Import repository `Newwic/CUTINEO`
2. ตั้งค่า environment variables ตาม `.env.example`
3. ใช้ build command `npm run build` และ start command `npm run start`
4. นำ deployment domain ไปตั้งเป็น LINE Webhook URL

ไฟล์ Vite/HTML เดิมยังเก็บไว้ใน repository เพื่อ rollback และอ้างอิงงานเดิม แต่แอปหลักของโครงสร้างใหม่อยู่ที่ `src/app`

อย่า commit `.env.local`, API keys, LINE tokens หรือ Supabase service role key ลง repository

## Pricing, Subscription และ AI Usage

รัน migration ตามลำดับ `001_initial_schema.sql`, `002_security_hardening.sql` และ `003_billing_ai_usage.sql` ใน Supabase SQL Editor โดย migration ใหม่ใช้ `tenants` เดิมเป็น company boundary และไม่ลบข้อมูลแชทเดิม

ระบบใหม่มี:

- Plan catalog กลาง: Starter ฿490 / 3,000, Pro ฿990 / 30,000, Advanced ฿1,990 / 100,000 และ Enterprise แบบ Custom
- AI Boost ฿490 เพิ่ม 20,000 messages เฉพาะ billing cycle ปัจจุบัน
- Feature Entitlement Service กลางสำหรับ permission ของ package
- AI Router ที่รองรับ Gemini และ OpenAI พร้อม server-side failover
- Usage ledger ราย request และ aggregate รายวันใน `ai_usage` / `ai_usage_daily`
- Customer usage: `/dashboard/ai-usage`
- Pricing: `/pricing`
- Admin cost dashboard: `/admin/ai-usage`

ตั้งค่า `AI_DEFAULT_PROVIDER`, `GEMINI_API_KEY` หรือ `OPENAI_API_KEY`, `AI_USD_TO_THB` และ `CUTINEO_PLATFORM_ADMIN_USER_IDS` ใน environment ฝั่ง server เท่านั้น ห้ามส่ง API key ไป frontend

AI Boost API สร้างคำสั่งซื้อสถานะ `pending` และยังไม่เพิ่ม quota จนกว่าจะมี payment webhook หรือกระบวนการ billing มา activate เป็น `active` เพื่อป้องกันการให้ quota ฟรี
