'use client';

import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

interface Usage {
  used: number;
  limit: number;
  remaining: number;
  usagePercent: number;
  boostLimit: number;
  estimatedCostThb: number;
  planId: string;
  status: string;
}

const DEMO_USAGE: Usage = {
  used: 2_400,
  limit: 3_000,
  remaining: 600,
  usagePercent: 80,
  boostLimit: 0,
  estimatedCostThb: 18.42,
  planId: 'starter',
  status: 'warning',
};

export default function AIUsageCard({ onNotice }: { onNotice?: (message: string) => void }) {
  const [usage, setUsage] = useState<Usage>(DEMO_USAGE);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadUsage() {
      if (!supabaseClient) return;
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) return;
      const response = await fetch('/api/billing/usage', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!response.ok) return;
      const payload = await response.json() as { usage?: Usage };
      if (mounted && payload.usage) {
        setUsage(payload.usage);
        setIsDemo(false);
      }
    }
    void loadUsage();
    return () => { mounted = false; };
  }, []);

  async function buyBoost() {
    if (isDemo || !supabaseClient) {
      onNotice?.('Demo mode: AI Boost จะทำงานเมื่อเชื่อมบัญชีจริงและเปิด Billing แล้ว');
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) throw new Error('กรุณาเข้าสู่ระบบก่อน');
      const response = await fetch('/api/billing/ai-boost', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error ?? 'สร้างคำขอ AI Boost ไม่สำเร็จ');
      onNotice?.(payload.message ?? 'สร้างคำขอ AI Boost แล้ว');
    } catch (error) {
      onNotice?.(error instanceof Error ? error.message : 'สร้างคำขอ AI Boost ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  function upgrade() {
    window.location.assign('/pricing');
  }

  const percent = Math.min(100, Math.max(0, usage.usagePercent));
  const alert = percent >= 100
    ? 'โควตาเต็มแล้ว · AI จะหยุดตอบตาม policy'
    : percent >= 90
      ? 'ใกล้หมดแล้ว · แนะนำให้ซื้อ AI Boost'
      : percent >= 80
        ? 'แจ้งเตือนเจ้าของบริษัท: Usage สูง'
        : percent >= 70
          ? 'AI Usage เริ่มสูง'
          : '';
  return (
    <div className={`ai-usage-card usage-status-${usage.status}`}>
      <div className="usage-title">
        <span><Sparkles size={13} aria-hidden="true" /> AI Usage</span>
        <strong>{percent}%</strong>
      </div>
      <div className="usage-bar" aria-label={`${percent}% AI usage`}><span style={{ width: `${percent}%` }} /></div>
      {alert && <small className="usage-alert">{alert}</small>}
      <p>{usage.used.toLocaleString('th-TH')} / {usage.limit.toLocaleString('th-TH')} AI Messages</p>
      <div className="usage-meta">
        <span>เหลือ {usage.remaining.toLocaleString('th-TH')}</span>
        <span>Cost ฿{usage.estimatedCostThb.toFixed(2)}</span>
      </div>
      {usage.boostLimit > 0 && <small className="usage-boost-note">รวม AI Boost +{usage.boostLimit.toLocaleString('th-TH')}</small>}
      <div className="usage-actions">
        <button type="button" onClick={() => void buyBoost()} disabled={loading}>ซื้อ AI Boost</button>
        <button type="button" onClick={upgrade}>Upgrade <span>→</span></button>
      </div>
    </div>
  );
}
