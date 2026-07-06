'use client';

import Link from 'next/link';
import { BookOpen, Heart, LayoutDashboard, LogOut, Search, ShoppingBag, Star, UserRound } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type DashboardCourse = {
  progressPercent: number;
  course: { id: string; title: string; description?: string };
};

type DashboardUser = {
  name: string;
};

export function StudentDashboard() {
  const { data = [] } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => api<DashboardCourse[]>('/me/courses'),
  });
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api<DashboardUser>('/users/me'),
    retry: false,
  });
  const primary = data[0];
  const avg = data.length ? Math.round(data.reduce((sum, item) => sum + item.progressPercent, 0) / data.length) : 0;
  const userName = user?.name ?? 'Student';

  return (
    <div className="dash-shell">
      <DashboardSidebar />
      <main className="dash-main">
        <div className="dash-topbar">
          <div className="header-search">
            <Search size={17} />
            <input type="text" placeholder="Search courses, modules..." readOnly />
          </div>
          <div className="spacer" />
          <Link href="/my-courses" className="icon-btn" aria-label="My courses">
            <ShoppingBag size={17} />
            <span className="badge">0</span>
          </Link>
          <Link href="/profile" className="profile-chip">
            <span className="avatar av-1">{userName.slice(0, 1).toUpperCase()}</span>
            {userName}
          </Link>
        </div>

        <div className="welcome-panel">
          <div className="dash-welcome-row">
            <div>
              <span className="live-badge">Live learning</span>
              <h2 className="q-h2 dash-welcome-title">Welcome back, {userName.split(' ')[0]}.</h2>
              <p className="dash-welcome-copy">
                {primary
                  ? `Your "${primary.course.title}" course is ${primary.progressPercent}% complete. Keep the rhythm going.`
                  : 'Your learning dashboard is ready. Enroll in a course to start tracking progress.'}
              </p>
            </div>
            <div className="dash-estimate">
              <div>{data.length ? `${Math.max(1, 14 - Math.round(avg / 10))} Days` : '0 Days'}</div>
              <span>Est. completion</span>
            </div>
          </div>
        </div>

        <div className="dash-grid">
          <div className="dash-card">
            <h4 className="q-h3 dash-card-title">Course pulse</h4>
            <div className="muted-small">Everything is running on schedule.</div>
            <div className="pulse-bar">
              <i style={{ width: `${avg}%` }} />
            </div>
          </div>
          <div className="dash-card">
            <h4 className="q-h3 dash-card-title">Upcoming</h4>
            <div className="muted-small">What is next in your current course.</div>
            <div className="task-list">
              {['Watch the next lesson', 'Submit project work for review', 'Download your certificate template'].map((task, index) => (
                <div key={task} className="task-item">
                  <span className={`av-${index + 1}`} />
                  {task}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="dash-section">
          <div className="dash-section-head">
            <h3 className="q-h3">Enrolled courses</h3>
            <Link href="/courses">Browse more</Link>
          </div>
          <div className="enrolled-grid">
            {data.map((item, index) => (
              <Link href={`/my-courses/${item.course.id}`} className="enrolled-card" key={item.course.id}>
                <div className={`course-thumb bg-${(index % 6) + 1} enrolled-thumb`}>
                  <BookOpen size={30} strokeWidth={1.6} />
                </div>
                <div className="enrolled-body">
                  <span className="course-cat">Enrolled</span>
                  <h4 className="q-h3 enrolled-title">{item.course.title}</h4>
                  <div className="pulse-bar enrolled-progress">
                    <i style={{ width: `${item.progressPercent}%` }} />
                  </div>
                  <div className="enrolled-meta">
                    <span>{item.progressPercent}% complete</span>
                    <span>Resume -&gt;</span>
                  </div>
                </div>
              </Link>
            ))}
            {!data.length ? (
              <div className="dash-card">
                <h4 className="q-h3">No enrolled courses yet</h4>
                <p className="muted-copy">Browse the catalog and enroll to see courses here.</p>
                <Link href="/courses" className="btn btn-primary dash-empty-action">Browse courses</Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => null);
    queryClient.clear();
    router.push('/login');
    router.refresh();
  }

  function sideClass(href: string) {
    return `side-link ${pathname === href || pathname.startsWith(`${href}/`) ? 'active' : ''}`;
  }

  return (
    <aside className="dash-sidebar">
      <Link href="/" className="logo dash-logo">
        <span className="dot" />
        QNYNE
      </Link>
      <Link href="/dashboard" className={sideClass('/dashboard')}><LayoutDashboard size={17} />Dashboard</Link>
      <Link href="/profile" className={sideClass('/profile')}><UserRound size={17} />My Profile</Link>
      <Link href="/my-courses" className={sideClass('/my-courses')}><BookOpen size={17} />Enrolled Courses</Link>
      <Link href="/courses" className="side-link"><Star size={17} />Explore</Link>
      <Link href="/certificates" className={sideClass('/certificates')}><Heart size={17} />Certificates</Link>
      <button className="side-link side-button" type="button" onClick={logout}>
        <LogOut size={17} />Logout
      </button>
    </aside>
  );
}
