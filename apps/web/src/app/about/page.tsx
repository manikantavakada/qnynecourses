import Link from 'next/link';

const values = ['Build visible proof', 'Learn with mentors', 'Measure progress honestly', 'Keep the experience focused'];

export default function AboutPage() {
  return (
    <section className="section">
      <div className="wrap about-layout">
        <div className="section-head">
          <span className="eyebrow">About QNYNE</span>
          <h1 className="q-h1">A learning platform for people who want to do the work.</h1>
          <p>
            QNYNE pairs project-based courses with structured progress tracking so learning turns into
            portfolio evidence, not passive watching.
          </p>
          <Link href="/courses" className="btn btn-primary page-cta">Explore courses</Link>
        </div>
        <div className="dash-card about-card">
          {values.map((value, index) => (
            <div className="status-row" key={value}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
