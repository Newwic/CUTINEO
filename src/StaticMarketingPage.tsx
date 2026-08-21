import CustomerChatWidget from './components/CustomerChatWidget';
import MarketingPage, { type MarketingPageKind } from './components/marketing/MarketingPage';
import { PwaProvider } from './components/pwa/PwaProvider';

export default function StaticMarketingPage({ kind }: { kind: MarketingPageKind }) {
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return (
    <PwaProvider serviceWorkerPath={`${import.meta.env.BASE_URL}sw.js`} enabled={import.meta.env.PROD}>
      <MarketingPage kind={kind} basePath={basePath} />
      <CustomerChatWidget apiUrl={import.meta.env.VITE_CHAT_API_URL || '/api/chat-stream'} />
    </PwaProvider>
  );
}
