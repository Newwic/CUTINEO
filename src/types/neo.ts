export const NEO_STATES = [
  'IDLE',
  'WALK',
  'FLY',
  'THINKING',
  'READING',
  'WRITING',
  'SEARCHING',
  'RUNNING_PROGRAM',
  'SUCCESS',
  'WARNING',
  'ERROR',
  'SLEEP',
  'LISTENING',
  'SPEAKING',
] as const;

export type NeoState = (typeof NEO_STATES)[number];
export type Severity = 'info' | 'success' | 'warning' | 'error';

export const NEO_EVENTS = [
  'neo.ready',
  'neo.sleep',
  'neo.wake',
  'task.started',
  'task.update',
  'task.paused',
  'task.resumed',
  'task.completed',
  'task.failed',
  'file.opened',
  'file.reading',
  'file.writing',
  'folder.opened',
  'search.started',
  'search.result',
  'application.opened',
  'terminal.running',
  'model.thinking',
  'model.responding',
  'voice.listening',
  'voice.speaking',
  'connection.online',
  'connection.offline',
  'approval.required',
] as const;

export type NeoEventName = (typeof NEO_EVENTS)[number];

export interface NeoEvent {
  event: NeoEventName;
  taskId?: string;
  state?: NeoState;
  title?: string;
  application?: string;
  path?: string;
  progress?: number | null;
  message?: string;
  severity?: Severity;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export interface TaskState {
  id: string;
  title: string;
  state: NeoState;
  application?: string;
  path?: string;
  message?: string;
  progress: number | null;
  severity: Severity;
  startedAt: string;
  updatedAt: string;
  paused: boolean;
}
