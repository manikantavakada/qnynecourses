'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

type LoginResponse = {
  user: { name: string; email: string; role: 'STUDENT' | 'ADMIN' };
};

export function AdminLoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const session = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (session.user.role !== 'ADMIN') {
        await api('/auth/logout', { method: 'POST' }).catch(() => null);
        setMessage('This login is only for admin accounts.');
        return;
      }
      queryClient.setQueryData(['current-user'], session.user);
      router.push('/admin/dashboard');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-side" style={{ background: 'linear-gradient(135deg, var(--ink) 0%, var(--ink-soft) 100%)' }}>
        <Link href="/" className="logo">
          <span className="dot" style={{ backgroundColor: 'var(--cyan)' }} />
          QNYNE Admin
        </Link>
        <div className="auth-quote">
          <span className="eyebrow" style={{ color: 'var(--cyan)', textTransform: 'uppercase' }}>Secure Control deck</span>
          <h2 className="q-h2" style={{ color: '#fff', fontSize: 30, marginTop: 12, lineHeight: 1.35 }}>
            Content, Commerce, & Access Control.
          </h2>
          <p style={{ fontSize: 14.5, color: 'var(--text-faint)', marginTop: 14, lineHeight: 1.6 }}>
            Manage course playlists, process video lessons, configure coupon codes, and monitor sales metrics.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cyan)' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-mono)' }}>Private HLS Streaming Validation</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cyan)' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-mono)' }}>Razorpay Webhooks & Expiry Manager</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cyan)' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-mono)' }}>Granular Student Enrollment Logs</span>
          </div>
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-form">
          <span className="eyebrow">Authentication</span>
          <h1 className="q-h1" style={{ fontSize: 32 }}>Sign in to Admin</h1>
          <p style={{ marginTop: 10, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Authorized administrator credentials are required to open the admin workspace.
          </p>

          <form onSubmit={submit} style={{ marginTop: 28 }}>
            <div className="field">
              <label htmlFor="email">Administrator Email</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="admin@qnyne.local" />
            </div>
            <div className="field">
              <label htmlFor="password">Security Password</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="••••••••" />
            </div>

            {message ? <div className="form-error" style={{ marginTop: 16 }}>{message}</div> : null}

            <button type="submit" className="btn btn-accent btn-block" disabled={loading} style={{ marginTop: 26, background: 'var(--grad-signature)', border: 'none' }}>
              {loading ? 'Accessing Workspace...' : 'Enter Admin Panel'}
            </button>
          </form>

          <div className="auth-switch">
            Looking for students? <Link href="/login" style={{ color: 'var(--indigo)' }}>Go to customer login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
