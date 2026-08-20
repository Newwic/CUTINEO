import type { Metadata } from 'next';
import LoginForm from '../login/LoginForm';

export const metadata: Metadata = {
  title: 'สร้างบัญชี | CUTINEO',
};

export default function RegisterPage() {
  return <LoginForm initialMode="signup" />;
}
