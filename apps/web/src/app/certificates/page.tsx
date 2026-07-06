'use client';

import Link from 'next/link';
import { Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard';
import { api } from '@/lib/api';

type Certificate = {
  id: string;
  courseId: string;
  certificateNumber: string;
  certificateUrl: string;
  issuedAt: string;
};

export default function CertificatesPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => api<Certificate[]>('/me/certificates'),
  });

  return (
    <div className="dash-shell">
      <DashboardSidebar />
      <main className="dash-main">
        <div className="section-head">
          <span className="eyebrow">Achievements</span>
          <h1 className="q-h1 page-title">Certificates</h1>
          <p>Your completion certificates appear here when a course is finished.</p>
        </div>

        {isLoading ? <p className="muted-copy">Loading certificates...</p> : null}
        <div className="enrolled-grid">
          {data.map((certificate, index) => (
            <a href={certificate.certificateUrl} className="enrolled-card" key={certificate.id} target="_blank" rel="noreferrer">
              <div className={`course-thumb bg-${(index % 6) + 1} enrolled-thumb`}>
                <Award size={34} strokeWidth={1.6} />
              </div>
              <div className="enrolled-body">
                <span className="course-cat">Certificate</span>
                <h4 className="q-h3 enrolled-title">{certificate.certificateNumber}</h4>
                <p className="muted-copy">Issued {new Date(certificate.issuedAt).toLocaleDateString()}</p>
              </div>
            </a>
          ))}
          {!data.length && !isLoading ? (
            <div className="dash-card settings-card">
              <Award size={34} color="var(--indigo)" />
              <h2 className="q-h3">No certificates yet</h2>
              <p className="muted-copy">Complete an enrolled course and your certificate will be listed here.</p>
              <Link href="/my-courses" className="btn btn-primary">Continue learning</Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
