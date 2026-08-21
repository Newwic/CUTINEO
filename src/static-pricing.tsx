import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StaticPricingPage from './StaticPricingPage';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing pricing page root');

createRoot(root).render(<StrictMode><StaticPricingPage /></StrictMode>);
