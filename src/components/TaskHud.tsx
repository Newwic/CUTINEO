import { useTaskStore } from '../state/taskStore';

export function TaskHud() {
  const tasks = useTaskStore((state) => state.tasks);
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const pauseActive = useTaskStore((state) => state.pauseActive);
  const stopActive = useTaskStore((state) => state.stopActive);
  const active = tasks.find((task) => task.id === activeTaskId);

  if (!active) return <div className="task-hud task-hud-empty"><span className="hud-dot" />ไม่มีงานกำลังทำ</div>;

  return (
    <section className="task-hud" aria-label="งานปัจจุบัน">
      <div className="hud-heading"><span className="hud-dot hud-dot-live" /><span>งานปัจจุบัน</span><span className="hud-state">{active.paused ? 'PAUSED' : active.state}</span></div>
      <strong className="hud-title">{active.title}</strong>
      <div className="hud-meta">{active.application || 'ระบบ'} {active.path ? `• ${active.path}` : ''}</div>
      <div className="hud-progress-wrap"><div className={`hud-progress ${active.progress === null ? 'indeterminate' : ''}`} style={active.progress === null ? undefined : { width: `${Math.round(active.progress * 100)}%` }} /></div>
      <div className="hud-actions"><button type="button" onClick={pauseActive}>{active.paused ? 'พักแล้ว' : 'Pause'}</button><button type="button" className="danger" onClick={stopActive}>Stop</button></div>
    </section>
  );
}
