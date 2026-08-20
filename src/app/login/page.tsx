import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | CUTINEO',
};

export default function LoginPage() {
  return <LoginForm />;
}
