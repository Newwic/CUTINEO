import { EventQueue } from './eventQueue';
import type { NeoEvent } from '../types/neo';

type ConnectionListener = (status: 'online' | 'offline' | 'connecting') => void;

export class OpenClawAdapter {
  readonly events = new EventQueue(100);
  private socket: WebSocket | null = null;
  private reconnectTimer: number | undefined;
  private attempts = 0;
  private readonly wsUrl = import.meta.env.VITE_OPENCLAW_WS_URL;
  private readonly connectionListeners = new Set<ConnectionListener>();

  onConnection(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  private setStatus(status: 'online' | 'offline' | 'connecting') {
    this.connectionListeners.forEach((listener) => listener(status));
  }

  connect(): void {
    if (!this.wsUrl || this.socket) {
      this.setStatus('offline');
      return;
    }
    this.setStatus('connecting');
    try {
      this.socket = new WebSocket(this.wsUrl);
      this.socket.onopen = () => { this.attempts = 0; this.setStatus('online'); };
      this.socket.onmessage = (message) => {
        try { this.events.push(JSON.parse(message.data)); } catch { /* Invalid gateway data is ignored safely. */ }
      };
      this.socket.onerror = () => this.setStatus('offline');
      this.socket.onclose = () => {
        this.socket = null;
        this.setStatus('offline');
        this.scheduleReconnect();
      };
    } catch {
      this.socket = null;
      this.setStatus('offline');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.wsUrl || this.reconnectTimer !== undefined) return;
    const delay = Math.min(30_000, 1_000 * 2 ** this.attempts++);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }

  publishMock(event: NeoEvent): void {
    this.events.push(event);
  }

  send(payload: Record<string, unknown>): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(payload));
    return true;
  }

  close(): void {
    if (this.reconnectTimer !== undefined) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.socket?.close();
    this.socket = null;
    this.setStatus('offline');
  }
}
