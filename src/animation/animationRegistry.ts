import type { NeoState } from '../types/neo';
import { STATE_PRIORITY } from '../state/statePriorities';

export interface AnimationDefinition {
  state: NeoState;
  className: string;
  label: string;
  loop: boolean;
  priority: number;
}

export const ANIMATIONS: Record<NeoState, AnimationDefinition> = {
  IDLE: { state: 'IDLE', className: 'anim-idle', label: 'พักพร้อมช่วยงาน', loop: true, priority: STATE_PRIORITY.IDLE },
  WALK: { state: 'WALK', className: 'anim-walk', label: 'กำลังเดิน', loop: true, priority: STATE_PRIORITY.WALK },
  FLY: { state: 'FLY', className: 'anim-fly', label: 'กำลังบิน', loop: true, priority: STATE_PRIORITY.FLY },
  THINKING: { state: 'THINKING', className: 'anim-thinking', label: 'กำลังคิด', loop: true, priority: STATE_PRIORITY.THINKING },
  READING: { state: 'READING', className: 'anim-reading', label: 'กำลังอ่านไฟล์', loop: true, priority: STATE_PRIORITY.READING },
  WRITING: { state: 'WRITING', className: 'anim-writing', label: 'กำลังแก้ไขไฟล์', loop: true, priority: STATE_PRIORITY.WRITING },
  SEARCHING: { state: 'SEARCHING', className: 'anim-searching', label: 'กำลังค้นหา', loop: true, priority: STATE_PRIORITY.SEARCHING },
  RUNNING_PROGRAM: { state: 'RUNNING_PROGRAM', className: 'anim-running', label: 'กำลังใช้งานโปรแกรม', loop: true, priority: STATE_PRIORITY.RUNNING_PROGRAM },
  SUCCESS: { state: 'SUCCESS', className: 'anim-success', label: 'งานเสร็จแล้ว', loop: false, priority: STATE_PRIORITY.SUCCESS },
  WARNING: { state: 'WARNING', className: 'anim-warning', label: 'มีคำเตือน', loop: true, priority: STATE_PRIORITY.WARNING },
  ERROR: { state: 'ERROR', className: 'anim-error', label: 'พบข้อผิดพลาด', loop: true, priority: STATE_PRIORITY.ERROR },
  SLEEP: { state: 'SLEEP', className: 'anim-sleep', label: 'กำลังพัก', loop: true, priority: STATE_PRIORITY.SLEEP },
  LISTENING: { state: 'LISTENING', className: 'anim-listening', label: 'กำลังฟัง', loop: true, priority: STATE_PRIORITY.LISTENING },
  SPEAKING: { state: 'SPEAKING', className: 'anim-speaking', label: 'กำลังตอบ', loop: true, priority: STATE_PRIORITY.SPEAKING },
};

export function getAnimation(state: NeoState): AnimationDefinition {
  return ANIMATIONS[state];
}
