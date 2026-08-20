'use client';

import { Clock3, Mail, Phone, Tag, UserRound } from 'lucide-react';

interface CustomerCRMDrawerProps {
  conversation: any;
}

function formatDate(value?: string) {
  if (!value) return 'ไม่ทราบ';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'ไม่ทราบ' : date.toLocaleDateString('th-TH');
}

function formatDateTime(value?: string) {
  if (!value) return 'ไม่ทราบ';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'ไม่ทราบ' : date.toLocaleString('th-TH');
}

export default function CustomerCRMDrawer({ conversation }: CustomerCRMDrawerProps) {
  const contact = conversation.contacts;
  const initial = contact?.display_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <div className="border-b border-slate-200 pb-5 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-indigo-100 text-xl font-black text-indigo-700">
          {initial}
        </div>
        <h3 className="mt-3 font-black text-slate-900">{contact?.display_name || 'ลูกค้า'}</h3>
        <p className="mt-1 text-xs text-slate-400">สร้างเมื่อ {formatDate(contact?.created_at)}</p>
      </div>

      <div className="flex-1 space-y-6 py-5 text-sm">
        <section>
          <h4 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">ข้อมูลติดต่อ</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Phone size={15} className="text-slate-400" aria-hidden="true" />
              <span>{contact?.phone || 'ยังไม่ได้ระบุเบอร์โทร'}</span>
            </div>
            <div className="flex items-center gap-2 break-all text-slate-700">
              <Mail size={15} className="text-slate-400" aria-hidden="true" />
              <span>{contact?.email || 'ยังไม่ได้ระบุอีเมล'}</span>
            </div>
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">แท็ก</h4>
          <div className="flex flex-wrap gap-1.5">
            {contact?.tags?.length ? (
              contact.tags.map((tag: string) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  <Tag size={11} aria-hidden="true" /> {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">ยังไม่มีแท็ก</span>
            )}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">บทสนทนา</h4>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <Clock3 size={15} className="mt-0.5 text-slate-400" aria-hidden="true" />
              <span>อัปเดตล่าสุด<br /><strong className="font-semibold text-slate-800">{formatDateTime(conversation.last_message_at)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <UserRound size={15} className="text-slate-400" aria-hidden="true" />
              <span>สถานะ: <strong className="font-semibold text-slate-800">{conversation.status || 'open'}</strong></span>
            </div>
          </div>
        </section>
      </div>

      <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
        ข้อมูลหน้านี้อยู่ภายใต้สิทธิ์ของ workspace และจะแสดงเฉพาะสมาชิกที่ได้รับอนุญาต
      </div>
    </div>
  );
}
