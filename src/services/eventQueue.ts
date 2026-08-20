import { parseNeoEvent } from '../schemas/neoEvent.schema';
import type { NeoEvent } from '../types/neo';

type Listener = (event: NeoEvent) => void;

export class EventQueue {
  private readonly limit: number;
  private readonly listeners = new Set<Listener>();
  private readonly recent = new Set<string>();
  private readonly queue: NeoEvent[] = [];

  constructor(limit = 100) {
    this.limit = limit;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  push(input: unknown): boolean {
    const event = parseNeoEvent(input);
    if (!event) return false;
    const key = `${event.event}:${event.taskId ?? ''}:${event.timestamp}:${event.message ?? ''}`;
    if (this.recent.has(key)) return false;
    this.recent.add(key);
    if (this.recent.size > this.limit * 2) this.recent.delete(this.recent.values().next().value as string);
    this.queue.push(event);
    while (this.queue.length > this.limit) this.queue.shift();
    this.listeners.forEach((listener) => listener(event));
    return true;
  }

  getRecent(): NeoEvent[] {
    return [...this.queue];
  }
}
