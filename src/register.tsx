import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RegisterApp from './RegisterApp';
import './register.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RegisterApp />
  </StrictMode>,
);
