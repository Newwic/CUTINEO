import { useEffect, useMemo, useState } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { NeoCharacter } from './components/NeoCharacter';
import { makeEvent } from './schemas/neoEvent.schema';
import { useNeoStore } from './state/neoStore';
import { OpenClawAdapter } from './services/openClawAdapter';
import { resizePetWindow } from './services/windowService';

export default function App() {
  const adapter = useMemo(() => new OpenClawAdapter(), []);
  const neo = useNeoStore();
  const isTauri = '__TAURI_INTERNALS__' in window;
  const [commandOpen, setCommandOpen] = useState(!isTauri);

  useEffect(() => {
    if (!isTauri) return;
    void resizePetWindow(commandOpen ? 'command' : 'pet');
  }, [commandOpen, isTauri]);

  useEffect(() => {
    const unsubscribeEvent = adapter.events.subscribe((event) => {
      useNeoStore.getState().applyEvent(event);
      if (event.event === 'task.completed') {
        window.setTimeout(() => useNeoStore.getState().clearTransient(), 1800);
      }
    });
    const unsubscribeConnection = adapter.onConnection((connection) => {
      useNeoStore.getState().setConnection(connection);
    });
    adapter.connect();
    adapter.publishMock(makeEvent('neo.ready', {
      state: 'IDLE',
      title: 'พร้อมทำงาน',
      message: 'พร้อมช่วยงานครับ',
      severity: 'info',
    }));
    return () => {
      unsubscribeEvent();
      unsubscribeConnection();
      adapter.close();
    };
  }, [adapter]);

  return (
    <main className={`neo-shell ${isTauri ? 'pet-mode' : 'web-mode'} ${commandOpen ? 'has-panel' : ''}`}>
      <section className="stage" aria-label="NEO Desktop Pet Stage">
        <NeoCharacter state={neo.state} onClick={() => setCommandOpen(true)} />
      </section>
      {commandOpen && (
        <ChatPanel adapter={adapter} onClose={() => setCommandOpen(false)} />
      )}
    </main>
  );
}
