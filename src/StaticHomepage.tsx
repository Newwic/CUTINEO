import HomepageV2 from './components/landing/HomepageV2';
import CustomerChatWidget from './components/CustomerChatWidget';
import { PwaProvider } from './components/pwa/PwaProvider';

export default function StaticHomepage() {
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return (
    <PwaProvider serviceWorkerPath={`${import.meta.env.BASE_URL}sw.js`} enabled={import.meta.env.PROD}>
      <HomepageV2 basePath={basePath} signupRoute="register.html" loginRoute="login/" />
      <CustomerChatWidget apiUrl={import.meta.env.VITE_CHAT_API_URL || '/api/chat-stream'} />
    </PwaProvider>
  );
}
