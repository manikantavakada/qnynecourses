import { api } from '@/lib/api';

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await api(`/auth/verify-email/${token}`);
  return <div className="rounded border border-line bg-white p-4">Email verified. You can log in now.</div>;
}
