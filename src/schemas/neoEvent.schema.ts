import { NEO_EVENTS, NEO_STATES, type NeoEvent, type NeoEventName, type NeoState, type Severity } from '../types/neo';

const eventSet = new Set<string>(NEO_EVENTS);
const stateSet = new Set<string>(NEO_STATES);
const severitySet = new Set<string>(['info', 'success', 'warning', 'error']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isNeoEvent(value: unknown): value is NeoEvent {
  if (!isRecord(value)) return false;
  if (typeof value.event !== 'string' || !eventSet.has(value.event)) return false;
  if (typeof value.timestamp !== 'string' || Number.isNaN(Date.parse(value.timestamp))) return false;
  if (value.state !== undefined && (typeof value.state !== 'string' || !stateSet.has(value.state))) return false;
  if (value.severity !== undefined && (typeof value.severity !== 'string' || !severitySet.has(value.severity))) return false;
  if (value.progress !== undefined && value.progress !== null && (typeof value.progress !== 'number' || value.progress < 0 || value.progress > 1)) return false;
  if (value.taskId !== undefined && typeof value.taskId !== 'string') return false;
  if (value.title !== undefined && typeof value.title !== 'string') return false;
  if (value.path !== undefined && typeof value.path !== 'string') return false;
  if (value.application !== undefined && typeof value.application !== 'string') return false;
  if (value.message !== undefined && typeof value.message !== 'string') return false;
  return true;
}

export function parseNeoEvent(value: unknown): NeoEvent | null {
  return isNeoEvent(value) ? value : null;
}

export function makeEvent(event: NeoEventName, fields: Omit<NeoEvent, 'event' | 'timestamp'> = {}): NeoEvent {
  return { event, timestamp: new Date().toISOString(), ...fields };
}

export function normalizeState(value: unknown, fallback: NeoState = 'IDLE'): NeoState {
  return typeof value === 'string' && stateSet.has(value) ? (value as NeoState) : fallback;
}

export function normalizeSeverity(value: unknown, fallback: Severity = 'info'): Severity {
  return typeof value === 'string' && severitySet.has(value) ? (value as Severity) : fallback;
}
