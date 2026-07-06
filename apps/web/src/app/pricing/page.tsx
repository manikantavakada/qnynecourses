import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

const plans = [
  ['Starter', 'Free', 'Browse lessons, previews, and learning paths before enrolling.'],
  ['Course access', 'Pay per course', 'Own the full course, mentor tasks, resources, and certificates.'],
  ['Team cohort', 'Custom', 'Structured training for teams who want shared outcomes.'],
];

export default function PricingPage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Pricing plans</span>
          <h1 className="q-h1">Simple pricing for focused progress.</h1>
          <p>Start free, then enroll only when a course matches the work you want to build.</p>
        </div>
        <div className="pricing-grid">
          {plans.map(([name, price, description], index) => (
            <article className={`dash-card pricing-card ${index === 1 ? 'featured' : ''}`} key={name}>
              <span className="course-cat">{name}</span>
              <h2 className="q-h2">{price}</h2>
              <p>{description}</p>
              <ul>
                {['Project-led curriculum', 'Progress dashboard', 'Completion certificate'].map((item) => (
                  <li key={item}><CheckCircle2 size={16} />{item}</li>
                ))}
              </ul>
              <Link href="/courses" className={`btn ${index === 1 ? 'btn-light' : 'btn-primary'} btn-block`}>View courses</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
