import { redirect } from 'next/navigation';

interface SignupPageProps {
  searchParams?: {
    plan?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const plan = typeof searchParams?.plan === 'string' ? searchParams.plan : '';
  redirect(plan ? `/register?plan=${encodeURIComponent(plan)}` : '/register');
}
