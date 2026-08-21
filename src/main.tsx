import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './StaticHomepage';
import './styles.css';

document.documentElement.classList.toggle('tauri-shell', '__TAURI_INTERNALS__' in window);
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
