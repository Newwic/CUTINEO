import type { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'ตั้งรหัสผ่านใหม่ | CUTINEO',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
