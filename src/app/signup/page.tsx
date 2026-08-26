import { redirect } from 'next/navigation';

interface SignupPageProps {
  searchParams?: Promise<{
    plan?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  await searchParams;
  redirect('/login?registration=disabled');
}
