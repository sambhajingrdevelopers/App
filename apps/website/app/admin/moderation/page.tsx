'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import SocialAppShell from '../../../components/SocialAppShell';

export default function AdminModerationPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [verification, setVerification] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadModeration() {
    try {
      const response = await fetch('/api/admin/moderation', { cache: 'no-store' });
      const data = await response.json();

      setReports(data.reports || []);
      setVerification(data.verification || []);
      setAds(data.ads || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadModeration();
  }, []);

  async function updateReport(item: any, status: string) {
    setReports((prev) =>
      prev.map((report) => report.id === item.id ? { ...report, status } : report)
    );

    try {
      await fetch(`/api/admin/moderation/reports/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      setMessage(`Report marked as ${status}.`);
    } catch {
      setMessage('Report updated locally.');
    }
  }

  async function updateVerification(item: any, status: string) {
    setVerification((prev) =>
      prev.map((request) => request.id === item.id ? { ...request, status } : request)
    );

    try {
      await fetch(`/api/admin/moderation/verification/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      setMessage(`Verification ${status}.`);
    } catch {
      setMessage('Verification updated locally.');
    }
  }

  async function updateAd(item: any, status: string, progress: number) {
    setAds((prev) =>
      prev.map((ad) => ad.id === item.id ? { ...ad, status, progress } : ad)
    );

    try {
      await fetch(`/api/admin/moderation/ads/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, progress })
      });

      setMessage(`Ad marked as ${status}.`);
    } catch {
      setMessage('Ad updated locally.');
    }
  }

  return (
    <AdminGuard>
      <SocialAppShell
        active="admin"
        title="Admin Moderation"
        subtitle="Review safety reports, verification requests and ad campaigns."
      >
        <section className="moderationHero">
          <div>
            <span>{source === 'backend' ? 'Live Backend Moderation' : 'Fallback Moderation Ready'}</span>
            <h2>Admin review and approval center</h2>
            <p>Control user reports, creator verification and ad campaign status from one panel.</p>
          </div>

          <button type="button" onClick={loadModeration}>Refresh</button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="moderationStats">
          <div>
            <b>{reports.length}</b>
            <span>Reports</span>
          </div>
          <div>
            <b>{verification.length}</b>
            <span>Verification</span>
          </div>
          <div>
            <b>{ads.length}</b>
            <span>Ads</span>
          </div>
        </section>

        <section className="moderationGrid">
          <div className="moderationPanel">
            <h3>Safety Reports</h3>

            <div className="moderationList">
              {reports.map((item) => (
                <article className="moderationItem" key={item.id}>
                  <div>
                    <b>{item.target}</b>
                    <span>{item.reason}</span>
                    <p>{item.details || 'No details'}</p>
                    <em>{item.status}</em>
                  </div>

                  <div className="moderationActions">
                    <button type="button" onClick={() => updateReport(item, 'Review')}>Review</button>
                    <button type="button" onClick={() => updateReport(item, 'Resolved')}>Resolve</button>
                    <button type="button" onClick={() => updateReport(item, 'Rejected')}>Reject</button>
                  </div>
                </article>
              ))}

              {!reports.length && <div className="adminEmpty">No safety reports.</div>}
            </div>
          </div>

          <div className="moderationPanel">
            <h3>Verification Requests</h3>

            <div className="moderationList">
              {verification.map((item) => (
                <article className="moderationItem" key={item.id}>
                  <div>
                    <b>{item.username}</b>
                    <span>{item.category}</span>
                    <em>{item.status}</em>
                  </div>

                  <div className="moderationActions">
                    <button type="button" onClick={() => updateVerification(item, 'Approved')}>Approve</button>
                    <button type="button" onClick={() => updateVerification(item, 'Rejected')}>Reject</button>
                    <button type="button" onClick={() => updateVerification(item, 'Pending')}>Pending</button>
                  </div>
                </article>
              ))}

              {!verification.length && <div className="adminEmpty">No verification requests.</div>}
            </div>
          </div>
        </section>

        <section className="moderationPanel">
          <h3>Ad Campaign Review</h3>

          <div className="moderationList">
            {ads.map((item) => (
              <article className="moderationItem" key={item.id}>
                <div>
                  <b>{item.title}</b>
                  <span>{item.status} • {item.budget}</span>

                  <div className="adminProgress">
                    <span style={{ width: `${item.progress || 0}%` }} />
                  </div>
                </div>

                <div className="moderationActions">
                  <button type="button" onClick={() => updateAd(item, 'Running', 75)}>Run</button>
                  <button type="button" onClick={() => updateAd(item, 'Paused', item.progress || 30)}>Pause</button>
                  <button type="button" onClick={() => updateAd(item, 'Completed', 100)}>Complete</button>
                </div>
              </article>
            ))}

            {!ads.length && <div className="adminEmpty">No ad campaigns.</div>}
          </div>
        </section>
      </SocialAppShell>
    </AdminGuard>
  );
}
