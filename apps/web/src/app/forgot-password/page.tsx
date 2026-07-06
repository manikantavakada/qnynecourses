'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      const result = await api<{ success: boolean; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(result.resetToken ? `Reset link ready: /reset-password/${result.resetToken}` : 'If the email exists, a reset link has been prepared.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not request a reset link.');
    }
  }

  return (
    <div className="auth-lite">
      <Link href="/" className="logo">
        <span className="dot" />
        QNYNE
      </Link>
      <form className="auth-form auth-card" onSubmit={submit}>
        <span className="eyebrow">Account access</span>
        <h1 className="q-h1 auth-card-title">Reset your password</h1>
        <p className="muted-copy">Enter your email and we will create a password reset link.</p>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        {message ? <div className={message.includes('Could') ? 'form-error' : 'form-success'}>{message}</div> : null}
        <button className="btn btn-primary btn-block" type="submit">Send reset link</button>
        <div className="auth-switch">
          Remembered it? <Link href="/login">Log in</Link>
        </div>
      </form>
    </div>
  );
}
