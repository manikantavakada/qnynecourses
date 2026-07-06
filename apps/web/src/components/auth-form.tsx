'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api } from '@/lib/api';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const registerSchema = loginSchema.extend({ name: z.string().min(2), phone: z.string().optional() });

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const schema = mode === 'login' ? loginSchema : registerSchema;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <Link href="/" className="logo">
          <span className="dot" />
          QNYNE
        </Link>
        <div className="auth-quote">
          <p>
            "{mode === 'login'
              ? 'I went from watching tutorials to shipping a real product in twelve weeks. QNYNE held me accountable.'
              : 'The mentorship made the difference. I went from zero design experience to a portfolio I was proud to show.'}"
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
            <div className={`avatar ${mode === 'login' ? 'av-3' : 'av-2'}`} style={{ width: 38, height: 38 }}>
              {mode === 'login' ? 'S' : 'M'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {mode === 'login' ? 'Sarah Joseph' : 'Michael Kurian'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                {mode === 'login' ? 'Web Development Student' : 'UI/UX Design Student'}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 30, position: 'relative', zIndex: 1 }}>
          <AuthStat num="12,400+" label="Active learners" />
          <AuthStat num="240+" label="Courses" />
          <AuthStat num="4.8/5" label="Avg. rating" />
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-form">
          <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Get started'}</span>
          <h1 className="q-h1" style={{ fontSize: 32 }}>
            {mode === 'login' ? 'Log in to QNYNE' : 'Create your account'}
          </h1>
          <p style={{ marginTop: 10, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            {mode === 'login'
              ? 'Pick up exactly where you left off. Your courses and progress are waiting.'
              : 'Browse free, pay only when you are ready to enroll.'}
          </p>

          <form
            onSubmit={handleSubmit(async (values) => {
              setMessage(null);
              try {
                const session = await api<{ user?: unknown }>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(values) });
                if (mode === 'login' && session.user) queryClient.setQueryData(['current-user'], session.user);
                await queryClient.invalidateQueries({ queryKey: ['current-user'] });
                setMessage(mode === 'login' ? 'Logged in. Taking you to your learning dashboard...' : 'Account created. Please log in.');
                router.push(mode === 'login' ? '/dashboard' : '/login');
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Something went wrong');
              }
            })}
          >
            {mode === 'register' ? (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" placeholder="Your name" {...register('name' as never)} />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" placeholder="you@example.com" {...register('email' as never)} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder={mode === 'login' ? '••••••••' : 'At least 8 characters'} {...register('password' as never)} />
            </div>
            <div className="field-row">
              <label>
                <input type="checkbox" defaultChecked /> {mode === 'login' ? 'Remember me' : 'I agree to the Terms'}
              </label>
              {mode === 'login' ? <Link href="/forgot-password">Forgot password?</Link> : null}
            </div>

            {Object.values(errors)[0] ? <div className="form-error">{Object.values(errors)[0]?.message as string}</div> : null}
            {message ? <div className={message.includes('wrong') || message.includes('Error') ? 'form-error' : 'form-success'}>{message}</div> : null}

            <button type="submit" className="btn btn-accent btn-block" disabled={isSubmitting} style={{ marginTop: 26 }}>
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="auth-divider">or</div>
          <button className="btn btn-ghost btn-block" type="button">
            Continue with Google
          </button>

          <div className="auth-switch">
            {mode === 'login' ? 'New to QNYNE?' : 'Already have an account?'}{' '}
            <Link href={mode === 'login' ? '/register' : '/login'}>
              {mode === 'login' ? 'Create a free account' : 'Log in'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthStat({ num, label }: { num: string; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 650, color: '#fff' }}>{num}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{label}</div>
    </div>
  );
}
