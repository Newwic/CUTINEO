interface SpeechBubbleProps {
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  visible: boolean;
}

export function SpeechBubble({ message, severity, visible }: SpeechBubbleProps) {
  if (!visible) return null;
  return <div className={`speech-bubble speech-${severity}`} role="status">{message}</div>;
}
