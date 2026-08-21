import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StaticMarketingPage from './StaticMarketingPage';
import type { MarketingPageKind } from './components/marketing/MarketingPage';
import './styles.css';

const root = document.getElementById('root');
const kind = root?.dataset.marketingPage as MarketingPageKind | undefined;

if (!root || !kind) {
  throw new Error('Missing marketing page configuration');
}

createRoot(root).render(
  <StrictMode>
    <StaticMarketingPage kind={kind} />
  </StrictMode>,
);
