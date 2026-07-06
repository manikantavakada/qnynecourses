'use client';

import Link from 'next/link';
import { BarChart3, BookOpen, FileText, Gift, LogOut, UploadCloud, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/courses/new/upload', label: 'Video Uploads', icon: UploadCloud },
  { href: '/admin/blogs', label: 'Blogs', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: Gift },
  { href: '/admin/coupons', label: 'Coupons', icon: Gift },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api<{ name: string; role: string }>('/users/me'),
    retry: false,
  });

  if (pathname === '/admin/login') return <>{children}</>;

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => null);
    queryClient.clear();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="logo admin-logo">
          <span className="dot" />
          QNYNE Admin
        </Link>
        <nav className="admin-nav">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link href={item.href} className={`side-link ${active ? 'active' : ''}`} key={item.href}>
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button className="side-link side-button" type="button" onClick={logout}>
          <LogOut size={17} />
          Logout
        </button>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">Admin Panel</span>
            <h1 className="q-h3">Content and commerce control</h1>
          </div>
          <div className="profile-chip">
            <span className="avatar av-1">{(user?.name ?? 'A').slice(0, 1).toUpperCase()}</span>
            {user?.name ?? 'Admin'}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
