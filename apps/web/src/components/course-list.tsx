'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { sampleCourses } from '@/lib/sample-data';
import type { Course } from '@/types';
import { CourseCard } from './course-card';

const categories = ['All courses', 'Web Development', 'Product Design', 'Data Analytics', 'Marketing', 'Mobile Development'];
const marquee = ['WEB DEVELOPMENT', 'PRODUCT DESIGN', 'DATA ANALYTICS', 'DIGITAL MARKETING', 'MOBILE APPS', 'CLOUD & DEVOPS'];

export function CourseList({ landing = false }: { landing?: boolean }) {
  const [active, setActive] = useState('All courses');
  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api<Course[]>('/courses'),
  });
  const courses = data?.length ? data : sampleCourses;
  const visibleCourses = useMemo(
    () =>
      courses.filter((course, index) => {
        if (active === 'All courses') return true;
        const category = course.category?.name ?? inferredCategory(course.title, index);
        return category === active;
      }),
    [active, courses],
  );

  return (
    <>
      {landing ? <HomeHero /> : <CatalogHeader />}
      {landing ? <Marquee /> : null}

      <section className="section">
        <div className="wrap">
          <div className="section-head" data-reveal="true">
            <span className="eyebrow">{landing ? 'Catalog' : 'Catalog · 240+ courses'}</span>
            <h2 className="q-h2">{landing ? 'Pick your next skill' : 'Explore courses'}</h2>
            <p>
              Every course ships with lifetime updates, downloadable resources and a certificate
              the moment you finish.
            </p>
          </div>

          <div className="filters-bar">
            {categories.map((category) => (
              <button
                key={category}
                className={`chip ${active === category ? 'active' : ''}`}
                type="button"
                onClick={() => setActive(category)}
              >
                {category}
              </button>
            ))}
            <div className="spacer" />
            <select className="sort-select" aria-label="Sort courses">
              <option>Most popular</option>
              <option>Newest</option>
              <option>Price: low to high</option>
              <option>Highest rated</option>
            </select>
          </div>

          {isLoading ? <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Loading courses...</p> : null}
          <div className="course-grid">
            {visibleCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>

          {landing ? (
            <div className="text-center" style={{ marginTop: 40 }}>
              <Link href="/courses" className="btn btn-ghost">
                View all courses
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {landing ? (
        <>
          <Reviews />
          <CTA />
        </>
      ) : null}
    </>
  );
}

function HomeHero() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-copy">
          <span className="eyebrow">Online learning, built for outcomes</span>
          <h1 className="q-h1">
            Learn the skills
            <br />
            that <em>actually</em> move
            <br />
            your career.
          </h1>
          <p>
            QNYNE pairs project-based courses with focused learning paths so every hour you spend
            learning turns into something you can show, ship, or use.
          </p>
          <div className="hero-actions">
            <Link href="/courses" className="btn btn-primary">
              Browse courses
            </Link>
            <Link href="/register" className="btn btn-ghost">
              Create free account
            </Link>
            <p className="hero-note">No credit card needed to explore the catalog.</p>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="num">12,400+</div>
              <div className="label">Active learners</div>
            </div>
            <div className="stat">
              <div className="num">240+</div>
              <div className="label">Courses live</div>
            </div>
            <div className="stat">
              <div className="num">4.8/5</div>
              <div className="label">Average rating</div>
            </div>
          </div>
        </div>

        <div className="constellation-stage">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {[
              [46, 50, 14, 9],
              [46, 50, 60, 7],
              [46, 50, 30, 30],
              [46, 50, 74, 38],
              [46, 50, 9, 62],
              [46, 50, 52, 68],
              [46, 50, 24, 86],
              [46, 50, 70, 83],
            ].map(([x1, y1, x2, y2], index) => (
              <line
                key={index}
                className="const-line"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              />
            ))}
          </svg>
          {[
            ['JS', 'React', 'av-1', 'node-1'],
            ['Fx', 'Figma', 'av-2', 'node-2'],
            ['DB', 'SQL', 'av-3', 'node-3'],
            ['Py', 'Python', 'av-4', 'node-4'],
            ['Nd', 'Node.js', 'av-5', 'node-5'],
            ['UX', 'UI/UX', 'av-6', 'node-6'],
            ['Ig', 'Marketing', 'av-2', 'node-7'],
            ['RN', 'React Native', 'av-3', 'node-8'],
          ].map(([abbr, label, avatar, node], index) => (
            <div key={label} className={`const-node ${node}`} style={{ '--d': `${0.3 + index * 0.1}s` } as CSSProperties}>
              <span className={`ic ${avatar}`}>{abbr}</span>
              {label}
            </div>
          ))}
          <div className="const-card">
            <div className="live">Live progress</div>
            <div className="title">Full-Stack Web Development</div>
            <div className="bar">
              <i style={{ width: '74%' }} />
            </div>
            <div className="pct">74% complete · 2 modules left</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CatalogHeader() {
  return (
    <div className="wrap container-page" style={{ paddingBottom: 0 }}>
      <div className="section-head">
        <span className="eyebrow">Catalog · 240+ courses</span>
        <h1 className="q-h1" style={{ fontSize: 'clamp(30px,4vw,46px)', marginTop: 14 }}>
          Explore courses
        </h1>
        <p>
          Filter by what you are trying to get good at. Every course includes lifetime access to
          updates and a certificate on completion.
        </p>
      </div>
    </div>
  );
}

function Marquee() {
  const items = [...marquee, ...marquee];
  return (
    <div className="marquee-row">
      <div className="marquee-track">
        {items.map((item, index) => (
          <span key={`${item}-${index}`}>{index % 2 ? '•' : item}</span>
        ))}
      </div>
    </div>
  );
}

function Reviews() {
  return (
    <section className="section" style={{ background: 'var(--white)' }}>
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            Student voices
          </span>
          <h2 className="q-h2">What students say</h2>
          <p>Real outcomes from learners who turned a course into a career move.</p>
        </div>
        <div className="review-grid">
          {[
            ['S', 'Sarah Joseph', 'Web Development Student', 'The curriculum is brutally practical. Every module ends with something real shipped, not just a quiz.'],
            ['M', 'Michael Kurian', 'UI/UX Design Student', 'Mentor feedback was the difference. I went from zero design experience to a portfolio I was proud to show.'],
            ['E', 'Emily Rao', 'Data Analytics Student', 'A perfect blend of theory and real projects. The course made the hard weeks easier to push through.'],
          ].map(([initial, name, role, quote], index) => (
            <div key={name} className="review-card">
              <span className="stars">★★★★★</span>
              <p>"{quote}"</p>
              <div className="review-who">
                <div className={`avatar av-${index + 1}`}>{initial}</div>
                <div>
                  <div className="name">{name}</div>
                  <div className="role">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-banner">
          <div>
            <h2 className="q-h2">Start learning today.</h2>
            <p>Create a free account, browse the catalog, and unlock your first course in under two minutes.</p>
          </div>
          <div className="cta-actions">
            <Link href="/register" className="btn btn-light">
              Create account
            </Link>
            <Link href="/courses" className="btn btn-ghost" style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
              Browse courses
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function inferredCategory(title: string, index: number) {
  if (/design|ui|ux/i.test(title)) return 'Product Design';
  if (/data|sql|analytics/i.test(title)) return 'Data Analytics';
  if (/marketing|instagram|growth/i.test(title)) return 'Marketing';
  if (/mobile|native/i.test(title)) return 'Mobile Development';
  return index % 2 === 0 ? 'Web Development' : 'Product Design';
}
