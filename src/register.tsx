import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RegisterApp from './RegisterApp';
import { PwaProvider } from './components/pwa/PwaProvider';
import './register.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaProvider serviceWorkerPath={`${import.meta.env.BASE_URL}sw.js`} enabled={import.meta.env.PROD}>
      <RegisterApp />
    </PwaProvider>
  </StrictMode>,
);
