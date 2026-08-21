import Header from './components/layout/Header';
import PwaInstallSection from './components/pwa/PwaInstallSection';
import CustomerChatWidget from './components/CustomerChatWidget';
import { PwaProvider } from './components/pwa/PwaProvider';

export default function StaticInstallPage() {
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return (
    <PwaProvider serviceWorkerPath={`${import.meta.env.BASE_URL}sw.js`} enabled={import.meta.env.PROD}>
      <Header basePath={basePath} signupRoute="register.html" loginRoute="login/" activeKey="resources" />
      <PwaInstallSection />
      <CustomerChatWidget apiUrl={import.meta.env.VITE_CHAT_API_URL || '/api/chat-stream'} />
    </PwaProvider>
  );
}
