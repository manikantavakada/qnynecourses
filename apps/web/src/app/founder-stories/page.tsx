import Link from 'next/link';
import { ArrowRight, Quote } from 'lucide-react';

const stories = [
  ['Aarav Menon', 'Built a hiring-ready SaaS dashboard after years of unfinished tutorials.', 'Full-stack Web Development'],
  ['Meera Shah', 'Moved from static mockups to shipped product flows for a fintech team.', 'UI/UX Product Design'],
  ['Rohan Iyer', 'Turned an analytics capstone into a portfolio project that won interviews.', 'Data Analytics'],
];

export default function FounderStoriesPage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Founder Stories</span>
          <h1 className="q-h1">Proof-led learning, told by the people who shipped.</h1>
          <p>Stories from learners and mentors building real outcomes through QNYNE courses.</p>
        </div>
        <div className="story-grid">
          {stories.map(([name, quote, track], index) => (
            <article className="dash-card story-card" key={name}>
              <Quote size={24} color="var(--indigo)" />
              <p>{quote}</p>
              <div className="story-author">
                <span className={`avatar av-${index + 1}`}>{name.slice(0, 1)}</span>
                <div>
                  <b>{name}</b>
                  <span>{track}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <Link href="/courses" className="btn btn-primary page-cta">
          Explore courses <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
