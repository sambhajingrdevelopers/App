'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [source, setSource] = useState('loading');

  useEffect(() => {
    async function loadAdminData() {
      try {
        const response = await fetch('/api/admin/overview', { cache: 'no-store' });
        const result = await response.json();

        setData(result);
        setSource(result.source || 'fallback');
      } catch {
        setSource('fallback');
      }
    }

    loadAdminData();
  }, []);

  const analytics = data?.analytics || {};
  const users = data?.users || [];
  const reports = data?.reports || [];
  const verification = data?.verification || [];
  const ads = data?.ads || [];

  const stats = [
    { label: 'Total Users', value: String(analytics.totalUsers || 0), hint: 'Registered users' },
    { label: 'Reports', value: String(analytics.totalReports || 0), hint: `${analytics.pendingReports || 0} pending` },
    { label: 'Verification', value: String(analytics.verificationRequests || 0), hint: `${analytics.pendingVerification || 0} pending` },
    { label: 'Ads Revenue', value: analytics.adsRevenue || '₹0', hint: 'This month' },
    { label: 'System Health', value: analytics.systemHealth || '0%', hint: 'Backend health' },
    { label: 'API Source', value: source === 'backend' ? 'Live' : 'Fallback', hint: 'Admin data source' }
  ];

  return (
    <AuthGuard>
      <SocialAppShell
        active="admin"
        title="Admin Dashboard"
        subtitle="Control users, posts, reports, verification, ads and platform analytics."
      >
        <section className="adminHero">
          <div>
            <span>VibeLoop Control Center</span>
            <h2>Real platform management dashboard</h2>
            <p>
              Monitor users, review posts, manage reports, approve creators and track platform growth.
            </p>
          </div>

          <div className="adminLiveCard">
            <b>Live API</b>
            <strong>{source === 'backend' ? 'Connected' : 'Fallback'}</strong>
            <p>EC2 backend status</p>
          </div>
        </section>

        <section className="adminStatsGrid">
          {stats.map((item) => (
            <article className="adminStatCard" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.hint}</p>
            </article>
          ))}
        </section>

        <section className="adminGridTwo">
          <div className="adminPanel">
            <div className="adminPanelHead">
              <h3>User Management</h3>
              <button type="button">View All</button>
            </div>

            <div className="adminTable">
              {users.map((user: any) => (
                <div className="adminTableRow" key={user.id}>
                  <div>
                    <b>{user.name}</b>
                    <span>{user.username} • {user.role} • {user.email}</span>
                  </div>
                  <em>{user.status}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="adminPanel">
            <div className="adminPanelHead">
              <h3>Reports Queue</h3>
              <button type="button">Moderate</button>
            </div>

            <div className="adminTable">
              {reports.map((report: any) => (
                <div className="adminTableRow" key={report.id}>
                  <div>
                    <b>{report.username}</b>
                    <span>{report.id} • {report.reason}</span>
                  </div>
                  <em>{report.status}</em>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="adminGridTwo">
          <div className="adminPanel">
            <div className="adminPanelHead">
              <h3>Verification Requests</h3>
              <button type="button">Open</button>
            </div>

            <div className="adminTable">
              {verification.map((item: any) => (
                <div className="adminTableRow" key={item.id}>
                  <div>
                    <b>{item.username}</b>
                    <span>{item.category} • {item.id}</span>
                  </div>
                  <em>{item.status}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="adminPanel">
            <div className="adminPanelHead">
              <h3>Ad Campaigns</h3>
              <button type="button">Create</button>
            </div>

            {ads.map((ad: any) => (
              <div className="adminCampaign" key={ad.id}>
                <div>
                  <b>{ad.title}</b>
                  <span>{ad.status} • {ad.budget} budget</span>
                </div>
                <div className="adminProgress">
                  <span style={{ width: `${ad.progress || 50}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
