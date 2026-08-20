import type { NeoState } from '../types/neo';

export const STATE_PRIORITY: Record<NeoState, number> = {
  ERROR: 100,
  WARNING: 90,
  SUCCESS: 85,
  LISTENING: 80,
  SPEAKING: 80,
  THINKING: 70,
  READING: 70,
  WRITING: 70,
  SEARCHING: 70,
  RUNNING_PROGRAM: 70,
  FLY: 50,
  WALK: 40,
  SLEEP: 20,
  IDLE: 10,
};

export function canInterrupt(current: NeoState, next: NeoState): boolean {
  return STATE_PRIORITY[next] >= STATE_PRIORITY[current];
}
