import { create } from 'zustand';
import { normalizeSeverity, normalizeState } from '../schemas/neoEvent.schema';
import type { NeoEvent, NeoState, Severity } from '../types/neo';

interface NeoStore {
  state: NeoState;
  message: string;
  title: string;
  application: string;
  path: string;
  severity: Severity;
  connection: 'online' | 'offline' | 'connecting';
  lastUpdated: string;
  setState: (state: NeoState, message?: string, severity?: Severity) => void;
  applyEvent: (event: NeoEvent) => void;
  setConnection: (connection: NeoStore['connection']) => void;
  clearTransient: () => void;
}

export const useNeoStore = create<NeoStore>((set) => ({
  state: 'IDLE',
  message: 'พร้อมช่วยงานครับ',
  title: 'พร้อมทำงาน',
  application: 'NEO V1',
  path: '',
  severity: 'info',
  connection: 'offline',
  lastUpdated: new Date().toISOString(),
  setState: (state, message = 'กำลังทำงาน', severity = 'info') => set({
    state,
    message,
    severity,
    lastUpdated: new Date().toISOString(),
  }),
  applyEvent: (event) => set((current) => ({
    state: normalizeState(event.state, current.state),
    message: event.message ?? current.message,
    title: event.title ?? current.title,
    application: event.application ?? current.application,
    path: event.path ?? current.path,
    severity: normalizeSeverity(event.severity, current.severity),
    lastUpdated: event.timestamp,
  })),
  setConnection: (connection) => set({ connection }),
  clearTransient: () => set({ state: 'IDLE', message: 'พร้อมช่วยงานครับ', severity: 'info' }),
}));
