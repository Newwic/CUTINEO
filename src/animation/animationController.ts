import { canInterrupt } from '../state/statePriorities';
import type { NeoState } from '../types/neo';

export class AnimationController {
  private current: NeoState = 'IDLE';

  getCurrent(): NeoState {
    return this.current;
  }

  transition(next: NeoState, force = false): NeoState {
    if (force || canInterrupt(this.current, next)) this.current = next;
    return this.current;
  }
}
