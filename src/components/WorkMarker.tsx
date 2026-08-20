interface WorkMarkerProps {
  path: string;
  application: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  paused?: boolean;
}

export function WorkMarker({ path, application, severity, paused }: WorkMarkerProps) {
  if (!path && !application) return null;
  const shortened = path.length > 44 ? `${path.slice(0, 18)}…${path.slice(-21)}` : path;
  return (
    <div className={`work-marker marker-${severity} ${paused ? 'marker-paused' : ''}`} title={path}>
      <div className="marker-beacon" />
      <div className="marker-label"><strong>{application || 'ระบบ'}</strong><span>{paused ? 'Paused' : shortened || 'กำลังทำงาน'}</span></div>
    </div>
  );
}
