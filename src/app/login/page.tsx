import type { Metadata } from 'next';
import LoginForm from './LoginForm';
import { sanitizeRedirectPath } from '@/lib/auth/redirect';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | CUTINEO',
};

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = typeof searchParams?.next === 'string' ? searchParams.next : undefined;
  const registrationDisabled = searchParams?.registration === 'disabled';
  return <LoginForm nextPath={sanitizeRedirectPath(next)} registrationDisabled={registrationDisabled} />;
}
