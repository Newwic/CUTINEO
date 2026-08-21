export type CutineoNotificationKind =
  | 'new_message'
  | 'new_lead'
  | 'follow_up_due'
  | 'quotation_opened'
  | 'human_review';

export function canUseCutineoNotifications() {
  return typeof window !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator;
}
/** Call only from an explicit Notification Settings action, never on first load. */
export async function requestCutineoNotificationPermission() {
  if (!canUseCutineoNotifications()) return 'unsupported' as const;
  if (Notification.permission === 'granted') return 'granted' as const;
  if (Notification.permission === 'denied') return 'denied' as const;
  return Notification.requestPermission();
}

export function notificationLabel(kind: CutineoNotificationKind) {
  const labels: Record<CutineoNotificationKind, string> = {
    new_message: 'ข้อความใหม่',
    new_lead: 'Lead ใหม่',
    follow_up_due: 'Follow-up ถึงเวลา',
    quotation_opened: 'Quotation เปิดแล้ว',
    human_review: 'AI ต้องการ Human Review',
  };
  return labels[kind];
}
