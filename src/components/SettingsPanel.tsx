import { useState } from 'react';
import { setAlwaysOnTop as setNativeAlwaysOnTop, setClickThrough } from '../services/windowService';

interface SettingsPanelProps { locked: boolean; setLocked: (value: boolean) => void; alwaysOnTop: boolean; setAlwaysOnTop: (value: boolean) => void; clickThrough: boolean; setClickThroughState: (value: boolean) => void; onClose: () => void; }

export function SettingsPanel({ locked, setLocked, alwaysOnTop, setAlwaysOnTop, clickThrough, setClickThroughState, onClose }: SettingsPanelProps) {
  const [size, setSize] = useState(170);
  const [opacity, setOpacity] = useState(100);
  const [walk, setWalk] = useState(true);
  const [markers, setMarkers] = useState(true);

  const toggleClickThrough = async (value: boolean) => { setClickThroughState(value); await setClickThrough(value); };
  const toggleAlwaysOnTop = async (value: boolean) => { setAlwaysOnTop(value); await setNativeAlwaysOnTop(value); };
  return <aside className="settings-panel"><div className="panel-header"><div><span className="panel-eyebrow">SETTINGS</span><strong>ตั้งค่า NEO</strong></div><button type="button" className="icon-btn" onClick={onClose}>×</button></div>
    <div className="settings-section"><h3>General</h3><label className="setting-row"><span>ล็อกตำแหน่ง</span><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} /></label><label className="setting-row"><span>Always on Top</span><input type="checkbox" checked={alwaysOnTop} onChange={(event) => void toggleAlwaysOnTop(event.target.checked)} /></label><label className="setting-row"><span>Click Through</span><input type="checkbox" checked={clickThrough} onChange={(event) => void toggleClickThrough(event.target.checked)} /></label></div>
    <div className="settings-section"><h3>Appearance</h3><label className="range-row"><span>ขนาด {size}px</span><input type="range" min="80" max="300" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label><label className="range-row"><span>ความโปร่งใส {opacity}%</span><input type="range" min="40" max="100" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></label></div>
    <div className="settings-section"><h3>Behavior</h3><label className="setting-row"><span>เปิดการเดิน</span><input type="checkbox" checked={walk} onChange={(event) => setWalk(event.target.checked)} /></label><label className="setting-row"><span>แสดง Work Marker</span><input type="checkbox" checked={markers} onChange={(event) => setMarkers(event.target.checked)} /></label></div>
  </aside>;
}
