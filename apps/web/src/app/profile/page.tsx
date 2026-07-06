'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard';
import { api } from '@/lib/api';

type Profile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'STUDENT' | 'ADMIN';
  emailVerified: boolean;
};

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { data: profile, refetch, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api<Profile>('/users/me'),
    retry: false,
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setPhone(profile.phone ?? '');
  }, [profile]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await api<Profile>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      await refetch();
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update profile.');
    }
  }

  return (
    <div className="dash-shell">
      <DashboardSidebar />
      <main className="dash-main">
        <div className="section-head">
          <span className="eyebrow">My account</span>
          <h1 className="q-h1 page-title">Profile settings</h1>
          <p>Keep your learner profile and contact details current.</p>
        </div>

        <div className="settings-grid">
          <form className="dash-card settings-card" onSubmit={save}>
            <h2 className="q-h3">Personal details</h2>
            {isLoading ? <p className="muted-copy">Loading profile...</p> : null}
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" value={profile?.email ?? ''} readOnly />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional" />
            </div>
            {message ? <div className={message.includes('updated') ? 'form-success' : 'form-error'}>{message}</div> : null}
            <button className="btn btn-primary" type="submit">Save changes</button>
          </form>

          <div className="dash-card settings-card">
            <h2 className="q-h3">Account status</h2>
            <div className="status-row"><span>Role</span><b>{profile?.role ?? 'STUDENT'}</b></div>
            <div className="status-row"><span>Email</span><b>{profile?.emailVerified ? 'Verified' : 'Pending verification'}</b></div>
            <div className="status-row"><span>Workspace</span><b>QNYNE learner</b></div>
          </div>
        </div>
      </main>
    </div>
  );
}
