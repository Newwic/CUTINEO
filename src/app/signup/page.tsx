import { redirect } from 'next/navigation';

interface SignupPageProps {
  searchParams?: Promise<{
    plan?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = await searchParams;
  const plan = typeof resolvedSearchParams?.plan === 'string' ? resolvedSearchParams.plan : '';
  redirect(plan ? `/register?plan=${encodeURIComponent(plan)}` : '/register');
}
