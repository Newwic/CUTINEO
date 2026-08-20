import { describe, expect, it } from 'vitest';
import { isNeoEvent, makeEvent } from '../src/schemas/neoEvent.schema';

describe('NEO event validator', () => {
  it('accepts a valid task event', () => {
    expect(isNeoEvent(makeEvent('file.reading', { taskId: 'task_001', state: 'READING', title: 'กำลังอ่านไฟล์', progress: 0.4 }))).toBe(true);
  });

  it('rejects unknown events and invalid progress', () => {
    expect(isNeoEvent({ event: 'system.exec', timestamp: new Date().toISOString() })).toBe(false);
    expect(isNeoEvent({ event: 'task.update', timestamp: new Date().toISOString(), progress: 2 })).toBe(false);
  });

  it('rejects malformed paths in the event envelope only when the envelope is malformed', () => {
    expect(isNeoEvent({ event: 'file.reading', timestamp: new Date().toISOString(), path: 12 })).toBe(false);
  });
});
