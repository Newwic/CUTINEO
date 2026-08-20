import { makeEvent } from '../schemas/neoEvent.schema';
import type { OpenClawAdapter } from '../services/openClawAdapter';
import type { NeoState } from '../types/neo';

interface MockEventPanelProps { adapter: OpenClawAdapter; onClose: () => void; }

const mockEvents: Array<{ label: string; state: NeoState; event: 'task.update' | 'task.completed' | 'task.failed'; title: string; message: string; application: string; path?: string; severity?: 'info' | 'success' | 'warning' | 'error' }> = [
  { label: 'Thinking', state: 'THINKING', event: 'task.update', title: 'กำลังประมวลผล', message: 'กำลังวิเคราะห์คำสั่ง', application: 'NEO Model' },
  { label: 'Reading File', state: 'READING', event: 'task.update', title: 'กำลังอ่านไฟล์', message: 'กำลังตรวจสอบโครงสร้างไฟล์', application: 'File Explorer', path: 'D:\\Projects\\NEO-V1\\src\\App.tsx' },
  { label: 'Writing File', state: 'WRITING', event: 'task.update', title: 'กำลังแก้ไขไฟล์', message: 'กำลังบันทึกการเปลี่ยนแปลง', application: 'VS Code', path: 'D:\\Projects\\NEO-V1\\src\\styles.css' },
  { label: 'Searching', state: 'SEARCHING', event: 'task.update', title: 'กำลังค้นหา', message: 'กำลังค้นหาไฟล์ที่เกี่ยวข้อง', application: 'PowerShell', path: 'D:\\OpenClaw\\workspace' },
  { label: 'Terminal', state: 'RUNNING_PROGRAM', event: 'task.update', title: 'กำลังรันโปรแกรม', message: 'กำลังตรวจสอบผลลัพธ์คำสั่ง', application: 'Terminal', path: 'npm run test' },
  { label: 'Success', state: 'SUCCESS', event: 'task.completed', title: 'งานเสร็จเรียบร้อย', message: 'ตรวจสอบเสร็จแล้วครับ', application: 'NEO V1', severity: 'success' },
  { label: 'Warning', state: 'WARNING', event: 'task.update', title: 'ต้องการความสนใจ', message: 'พบขั้นตอนที่ต้องยืนยัน', application: 'NEO V1', severity: 'warning' },
  { label: 'Error', state: 'ERROR', event: 'task.failed', title: 'พบข้อผิดพลาด', message: 'ไม่สามารถเชื่อมต่อ Gateway ได้', application: 'OpenClaw', severity: 'error' },
];

export function MockEventPanel({ adapter, onClose }: MockEventPanelProps) {
  return <aside className="mock-panel"><div className="panel-header"><div><span className="panel-eyebrow">DEV MODE</span><strong>Mock Events</strong></div><button type="button" className="icon-btn" onClick={onClose}>×</button></div><p className="mock-note">ยิง Event จำลองเพื่อทดสอบ State และ HUD โดยไม่เรียกคำสั่งระบบจริง</p><div className="mock-grid">{mockEvents.map((item) => <button type="button" key={item.label} className={`mock-button mock-${item.state.toLowerCase()}`} onClick={() => adapter.publishMock(makeEvent(item.event, { taskId: 'mock_task_001', state: item.state, title: item.title, message: item.message, application: item.application, path: item.path, severity: item.severity ?? 'info', progress: item.state === 'READING' ? 0.55 : null }))}>{item.label}</button>)}</div></aside>;
}
