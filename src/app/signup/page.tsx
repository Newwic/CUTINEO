import { redirect } from 'next/navigation';

interface SignupPageProps {
  searchParams?: {
    plan?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  void searchParams;
  redirect('/login?registration=disabled');
}
