import type { Metadata } from 'next';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'รีเซ็ตรหัสผ่าน | CUTINEO',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
