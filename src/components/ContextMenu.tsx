interface ContextMenuProps { x: number; y: number; locked: boolean; alwaysOnTop: boolean; clickThrough: boolean; onAction: (action: string) => void; }

export function ContextMenu({ x, y, locked, alwaysOnTop, clickThrough, onAction }: ContextMenuProps) {
  const items = [
    ['เปิดแชต', 'chat'], ['ดูงานปัจจุบัน', 'task'], ['รับคำสั่งเสียง', 'voice'],
    [locked ? 'ปลดล็อกตำแหน่ง' : 'ล็อกตำแหน่ง', 'lock'], [alwaysOnTop ? 'ปิด Always on Top' : 'เปิด Always on Top', 'top'],
    [clickThrough ? 'ปิด Click Through' : 'เปิด Click Through', 'click-through'], ['ปรับขนาด', 'size'], ['ตั้งค่า', 'settings'], ['ซ่อน NEO', 'hide'], ['ออกจากโปรแกรม', 'quit'],
  ];
  return <nav className="context-menu" style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 360) }} aria-label="เมนู NEO">
    <div className="context-title">NEO CONTROL</div>{items.map(([label, action]) => <button type="button" key={action} onClick={() => onAction(action)}>{label}</button>)}
  </nav>;
}
