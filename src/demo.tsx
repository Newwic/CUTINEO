import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DemoApp from './DemoApp';
import { PwaProvider } from './components/pwa/PwaProvider';
import './demo.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaProvider serviceWorkerPath={`${import.meta.env.BASE_URL}sw.js`} enabled={import.meta.env.PROD}>
      <DemoApp />
    </PwaProvider>
  </StrictMode>,
);
