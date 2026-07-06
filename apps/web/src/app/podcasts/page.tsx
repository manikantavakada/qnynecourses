import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

const episodes = [
  ['Why portfolios beat certificates', '28 min', 'A practical conversation about building visible proof of skill.'],
  ['The first 100 hours of learning React', '34 min', 'How mentors structure practice so momentum does not disappear.'],
  ['Design reviews that actually improve work', '22 min', 'A product designer breaks down critique that moves projects forward.'],
];

export default function PodcastsPage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Podcasts</span>
          <h1 className="q-h1">Conversations for serious learners.</h1>
          <p>Short, focused episodes from QNYNE mentors, founders, and students.</p>
        </div>
        <div className="stack-list">
          {episodes.map(([title, duration, description]) => (
            <article className="dash-card media-row" key={title}>
              <span className="media-icon"><PlayCircle size={22} /></span>
              <div>
                <h2 className="q-h3">{title}</h2>
                <p>{description}</p>
              </div>
              <span className="mono-pill">{duration}</span>
            </article>
          ))}
        </div>
        <Link href="/courses" className="btn btn-primary page-cta">Browse related courses</Link>
      </div>
    </section>
  );
}
