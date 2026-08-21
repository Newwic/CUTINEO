import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StaticInstallPage from './StaticInstallPage';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing install page root');

createRoot(root).render(<StrictMode><StaticInstallPage /></StrictMode>);
