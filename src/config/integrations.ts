export type IntegrationStatus = 'available' | 'beta' | 'coming_soon';
export type IntegrationCategory = 'messaging' | 'social' | 'email';

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  logo: string;
  status: IntegrationStatus;
  description: string;
}

// Status is intentionally conservative: only adapters present in this
// repository are presented as available/beta. The remaining channels are
// visible for roadmap clarity and are never claimed as connected today.
export const integrations: Integration[] = [
  {
    id: 'line',
    name: 'LINE',
    category: 'messaging',
    logo: 'https://cdn.simpleicons.org/line/00C300',
    status: 'available',
    description: 'รวมข้อความจาก LINE เข้าสู่ CUTINEO',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    logo: 'https://cdn.simpleicons.org/facebook/1877F2',
    status: 'beta',
    description: 'เชื่อมต่อ Facebook Page ผ่าน webhook ที่มีในระบบ',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    category: 'messaging',
    logo: 'https://cdn.simpleicons.org/messenger/00B2FF',
    status: 'beta',
    description: 'อยู่ในช่วงทดสอบการรับข้อความจาก Meta',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    logo: 'https://cdn.simpleicons.org/instagram/E4405F',
    status: 'coming_soon',
    description: 'เตรียมรองรับ Instagram Messages',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    logo: 'https://cdn.simpleicons.org/whatsapp/25D366',
    status: 'coming_soon',
    description: 'เตรียมรองรับ WhatsApp Business',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    logo: 'https://cdn.simpleicons.org/tiktok/111111',
    status: 'coming_soon',
    description: 'เตรียมรองรับ TikTok Business',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'messaging',
    logo: 'https://cdn.simpleicons.org/telegram/26A5E4',
    status: 'coming_soon',
    description: 'เตรียมรองรับข้อความ Telegram',
  },
  {
    id: 'wechat',
    name: 'WeChat',
    category: 'messaging',
    logo: 'https://cdn.simpleicons.org/wechat/07C160',
    status: 'coming_soon',
    description: 'เตรียมรองรับ WeChat',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'email',
    logo: 'https://cdn.simpleicons.org/gmail/EA4335',
    status: 'coming_soon',
    description: 'เตรียมรองรับ Gmail Inbox',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    category: 'email',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/microsoftoutlook.svg',
    status: 'coming_soon',
    description: 'เตรียมรองรับ Microsoft Outlook',
  },
  {
    id: 'email',
    name: 'Email',
    category: 'email',
    logo: 'https://img.icons8.com/color/48/new-post.png',
    status: 'coming_soon',
    description: 'เตรียมรองรับอีเมลทั่วไปตามการตั้งค่า workspace',
  },
];

export const integrationCategories: Array<{ id: IntegrationCategory; label: string }> = [
  { id: 'messaging', label: 'Messaging' },
  { id: 'social', label: 'Social' },
  { id: 'email', label: 'Email' },
];
