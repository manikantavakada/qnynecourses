import Script from 'next/script';
import type { ReactNode } from 'react';
import { BarChart3, CheckCircle2, Clock, Lock, PlayCircle, Star, Users } from 'lucide-react';
import { BuyButton } from '@/components/buy-button';
import { api, paise } from '@/lib/api';
import { findSampleCourse } from '@/lib/sample-data';
import type { Course } from '@/types';

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await api<Course>(`/courses/${slug}`, { next: { revalidate: 60 } }).catch(() => findSampleCourse(slug));
  if (!course) return <div className="wrap container-page">Course not found.</div>;
  const price = course.discountPrice ?? course.price;
  const modules = course.modules ?? [];

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <section style={{ background: 'var(--white)', borderBottom: '1px solid var(--line)', padding: '40px 0 0' }}>
        <div className="wrap">
          <div style={{ fontSize: 13, color: 'var(--text-faint)', display: 'flex', gap: 8, marginBottom: 22 }}>
            <a href="/courses" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              Courses
            </a>
            <span>/</span>
            <span>{course.title}</span>
          </div>

          <div className="detail-layout">
            <div>
              <span className="eyebrow">{course.category?.name ?? 'Featured course'}</span>
              <h1 className="q-h1" style={{ marginTop: 16, fontSize: 'clamp(30px,3.6vw,42px)' }}>
                {course.title}
              </h1>
              <p style={{ fontSize: 16, marginTop: 14, maxWidth: 560, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                {course.description}
              </p>
              <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap', paddingBottom: 36 }}>
                <Meta icon={<Star size={16} />} label="Rating" value="4.9 (862 reviews)" />
                <Meta icon={<Clock size={16} />} label="Duration" value={`${Math.max(modules.length * 8, 24)}h`} />
                <Meta icon={<BarChart3 size={16} />} label="Level" value={course.level} />
                <Meta icon={<Users size={16} />} label="Students" value="3.1k enrolled" />
              </div>
            </div>

            <aside className="price-card">
              <div className="course-thumb bg-1" style={{ height: 170 }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,.92)',
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <PlayCircle size={28} />
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <div className="q-title" style={{ fontSize: 34 }}>
                    {price === 0 ? 'Free' : paise(price)}
                  </div>
                  {course.discountPrice ? (
                    <div style={{ color: 'var(--text-faint)', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                      {paise(course.price)}
                    </div>
                  ) : null}
                </div>
                <div style={{ marginTop: 20 }}>
                  <BuyButton courseId={course.id} />
                </div>
                <ul style={{ display: 'grid', gap: 12, margin: '22px 0 0', padding: 0, listStyle: 'none' }}>
                  {[
                    course.validityDays > 0 ? `${course.validityDays} days course validity` : 'Lifetime access & updates',
                    'Certificate on completion',
                    'Downloadable resources',
                    '30-day money-back guarantee'
                  ].map((item) => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                      <CheckCircle2 size={16} color="var(--indigo)" /> {item}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 18, color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  Login required to enroll · secure checkout
                </div>
              </div>
            </aside>
          </div>

          <div className="detail-tabs">
            <button className="detail-tab active" type="button">Curriculum</button>
            <button className="detail-tab" type="button">Description</button>
            <button className="detail-tab" type="button">Instructor</button>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ maxWidth: 760 }}>
          {modules.map((module, index) => (
            <div className="module" key={module.id}>
              <button className="module-head" type="button">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', fontSize: 13 }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h4 className="q-h3" style={{ fontSize: 15.5 }}>
                    {module.title}
                  </h4>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', fontSize: 12.5 }}>
                  {module.videos.length} lessons
                </span>
              </button>
              <div className="module-lessons">
                {module.videos.map((video) => (
                  <div className="lesson" key={video.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {video.isPreview ? <PlayCircle size={14} /> : <Lock size={14} />}
                      {video.title}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-faint)' }}>
                      {video.isPreview ? 'Preview' : 'Locked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
      {icon}
      <span>
        {label}: <b style={{ color: 'var(--ink)' }}>{value}</b>
      </span>
    </div>
  );
}
