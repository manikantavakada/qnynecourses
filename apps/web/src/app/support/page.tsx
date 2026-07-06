import Link from 'next/link';
import { Mail, ShieldCheck, Undo2 } from 'lucide-react';

const items = [
  ['Help center', 'Find account, course access, and playback support.', Mail],
  ['Refund policy', 'Course purchases are supported with a clear review window.', Undo2],
  ['Privacy and terms', 'Your account and learning data stay protected.', ShieldCheck],
];

export default function SupportPage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Support</span>
          <h1 className="q-h1">Help when you need it, without leaving the learning flow.</h1>
          <p>Use this page for support, refund, privacy, and contact information.</p>
        </div>
        <div className="story-grid">
          {items.map(([title, copy, Icon]) => {
            const SupportIcon = Icon as typeof Mail;
            return (
              <article className="dash-card support-card" key={title as string}>
                <SupportIcon size={24} color="var(--indigo)" />
                <h2 className="q-h3">{title as string}</h2>
                <p>{copy as string}</p>
              </article>
            );
          })}
        </div>
        <Link href="mailto:support@qnyne.local" className="btn btn-primary page-cta">Contact support</Link>
      </div>
    </section>
  );
}
