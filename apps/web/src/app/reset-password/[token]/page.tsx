'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await api(`/auth/reset-password/${params.token}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setMessage('Password updated. Taking you to login...');
      setTimeout(() => router.push('/login'), 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not reset password.');
    }
  }

  return (
    <div className="auth-lite">
      <Link href="/" className="logo">
        <span className="dot" />
        QNYNE
      </Link>
      <form className="auth-form auth-card" onSubmit={submit}>
        <span className="eyebrow">Secure reset</span>
        <h1 className="q-h1 auth-card-title">Create a new password</h1>
        <p className="muted-copy">Use at least eight characters for your new password.</p>
        <div className="field">
          <label htmlFor="password">New password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </div>
        {message ? <div className={message.includes('updated') ? 'form-success' : 'form-error'}>{message}</div> : null}
        <button className="btn btn-primary btn-block" type="submit">Update password</button>
      </form>
    </div>
  );
}
