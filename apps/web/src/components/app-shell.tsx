'use client';

import Link from 'next/link';
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type HeaderUser = {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
};

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/founder-stories', label: 'Founder Stories' },
  { href: '/podcasts', label: 'Podcasts' },
  { href: '/pricing', label: 'Pricing plans' },
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bareRoutes = ['/login', '/register', '/dashboard', '/my-courses', '/profile', '/certificates', '/admin'];
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api<HeaderUser>('/users/me').catch(() => null),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    setExploreOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setExploreOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (bareRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return <>{children}</>;
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => null);
    queryClient.setQueryData(['current-user'], null);
    router.push('/');
    router.refresh();
  }

  const accountHref = user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard') : '/login';

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="logo">
            <span className="dot" />
            QNYNE
          </Link>

          <div className={`nav-explore ${exploreOpen ? 'open' : ''}`} ref={exploreRef}>
            <button
              className="nav-explore-btn"
              type="button"
              aria-expanded={exploreOpen}
              aria-haspopup="menu"
              onClick={() => setExploreOpen((value) => !value)}
            >
              Explore <ChevronDown size={15} />
            </button>
            <div className="nav-explore-menu" role="menu">
              <Link href={accountHref} role="menuitem">My account</Link>
              {publicLinks.map((link) => (
                <Link href={link.href} role="menuitem" key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="header-search">
            <Search size={17} />
            <input type="text" placeholder="Search courses, topics..." readOnly />
          </div>

          <div className="header-actions">
            <Link href="/my-courses" className="icon-btn" aria-label="My courses">
              <ShoppingBag size={17} />
              <span className="badge">0</span>
            </Link>
            {user ? (
              <>
                <Link href={accountHref} className="profile-chip">
                  <span className="avatar av-1">{user.name.slice(0, 1).toUpperCase()}</span>
                  {user.name}
                </Link>
                <button className="link-login link-button" type="button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="link-login">
                  Log in
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </>
            )}
            <button className="burger" type="button" aria-label="Open menu" onClick={() => setMobileOpen((value) => !value)}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
          <Link href={accountHref}>My account</Link>
          {publicLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/certificates">Certificates</Link>
          {user ? (
            <div className="mm-actions">
              <Link href={accountHref} className="btn btn-primary btn-block">{user.name}</Link>
              <button className="btn btn-ghost btn-block" type="button" onClick={logout}>Logout</button>
            </div>
          ) : (
            <div className="mm-actions">
              <Link href="/login" className="btn btn-ghost btn-block">Log in</Link>
              <Link href="/register" className="btn btn-primary btn-block">Sign up</Link>
            </div>
          )}
        </div>
      </header>
      <main>{children}</main>
      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <span className="dot" />
              QNYNE
            </Link>
            <p>
              A course platform for people who want proof they can do the work, not just a transcript
              that says they watched it.
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <Link href="/courses">All courses</Link>
            <Link href="/pricing">Pricing plans</Link>
            <Link href="/founder-stories">Founder stories</Link>
            <Link href="/podcasts">Podcasts</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/about">About QNYNE</Link>
            <Link href="/about">Careers</Link>
            <Link href="/founder-stories">Blog</Link>
            <Link href="/support">Contact</Link>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <Link href="/support">Help center</Link>
            <Link href="/support">Refund policy</Link>
            <Link href="/support">Terms of service</Link>
            <Link href="/support">Privacy policy</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 QNYNE. All rights reserved.</span>
          <span>Built for focused online learning.</span>
        </div>
      </div>
    </footer>
  );
}
