'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardSidebar } from './dashboard';

type MyCourse = {
  id: string;
  expiresAt: string | null;
  progressPercent: number;
  course: { id: string; title: string; description: string };
};

export function MyCourses() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => api<MyCourse[]>('/me/courses'),
  });

  return (
    <div className="dash-shell">
      <DashboardSidebar />
      <main className="dash-main">
        <div className="section-head" style={{ marginBottom: 28 }}>
          <span className="eyebrow">My account</span>
          <h1 className="q-h1" style={{ fontSize: 'clamp(30px,4vw,46px)', marginTop: 14 }}>
            Enrolled courses
          </h1>
          <p>Resume lessons, track progress, and return to your course workspace.</p>
        </div>

        {isLoading ? <p style={{ color: 'var(--text-muted)' }}>Loading your courses...</p> : null}
        <div className="enrolled-grid">
          {data.map((item, index) => (
            <Link key={item.id} href={`/my-courses/${item.course.id}`} className="enrolled-card">
              <div className={`course-thumb bg-${(index % 6) + 1}`} style={{ height: 120 }}>
                <BookOpen size={34} strokeWidth={1.6} />
              </div>
              <div style={{ padding: '18px 20px' }}>
                <span className="course-cat">Enrolled</span>
                <h4 className="q-h3" style={{ fontSize: 16 }}>{item.course.title}</h4>
                <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 13, lineHeight: 1.55 }}>{item.course.description}</p>
                <div className="pulse-bar" style={{ height: 6, marginTop: 16 }}>
                  <i style={{ width: `${item.progressPercent}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-faint)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                  <span>{item.progressPercent}% complete</span>
                  <span>{item.expiresAt ? `Expires ${new Date(item.expiresAt).toLocaleDateString()}` : 'Lifetime'}</span>
                </div>
              </div>
            </Link>
          ))}
          {!data.length && !isLoading ? (
            <div className="dash-card">
              <h4 className="q-h3">No courses yet</h4>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Your purchased courses will appear here.</p>
              <Link href="/courses" className="btn btn-primary" style={{ marginTop: 18 }}>Browse courses</Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
