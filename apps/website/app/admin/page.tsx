'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [source, setSource] = useState('loading');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadAdminData() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/overview', { cache: 'no-store' });
      const result = await response.json();

      setData(result);
      setSource(result.source || 'fallback');
    } catch {
      setSource('fallback');
      setMessage('Admin data fallback mode active.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const analytics = data?.analytics || {};
  const users = data?.users || [];
  const reports = data?.reports || [];
  const verification = data?.verification || [];
  const ads = data?.ads || [];

  const q = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!q) return users;

    return users.filter((user: any) =>
      `${user.name} ${user.username} ${user.email} ${user.status} ${user.role}`
        .toLowerCase()
        .includes(q)
    );
  }, [users, q]);

  const filteredReports = useMemo(() => {
    if (!q) return reports;

    return reports.filter((report: any) =>
      `${report.id} ${report.username} ${report.reason} ${report.status}`
        .toLowerCase()
        .includes(q)
    );
  }, [reports, q]);

  const filteredVerification = useMemo(() => {
    if (!q) return verification;

    return verification.filter((item: any) =>
      `${item.id} ${item.username} ${item.category} ${item.status}`
        .toLowerCase()
        .includes(q)
    );
  }, [verification, q]);

  async function updateReportStatus(reportId: string, status: string) {
    setMessage('Updating report status...');

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.message || 'Report update failed');
      }

      setData((prev: any) => ({
        ...prev,
        reports: (prev?.reports || []).map((report: any) =>
          report.id === reportId ? { ...report, status } : report
        )
      }));

      setMessage(`Report ${reportId} updated to ${status}.`);
    } catch (error: any) {
      setMessage(error?.message || 'Report update failed.');
    }
  }

  async function updateVerificationStatus(requestId: string, status: string) {
    setMessage('Updating verification status...');

    try {
      const response = await fetch(`/api/admin/verification/${requestId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.message || 'Verification update failed');
      }

      setData((prev: any) => ({
        ...prev,
        verification: (prev?.verification || []).map((item: any) =>
          item.id === requestId ? { ...item, status } : item
        )
      }));

      setMessage(`Verification ${requestId} updated to ${status}.`);
    } catch (error: any) {
      setMessage(error?.message || 'Verification update failed.');
    }
  }

  const stats = [
    { label: 'Total Users', value: String(analytics.totalUsers || users.length || 0), hint: 'Registered users' },
    { label: 'Reports', value: String(analytics.totalReports || reports.length || 0), hint: `${analytics.pendingReports || 0} pending` },
    { label: 'Verification', value: String(analytics.verificationRequests || verification.length || 0), hint: `${analytics.pendingVerification || 0} pending` },
    { label: 'Ads Revenue', value: analytics.adsRevenue || '₹0', hint: 'This month' },
    { label: 'System Health', value: analytics.systemHealth || '0%', hint: 'Backend health' },
    { label: 'API Source', value: source === 'backend' ? 'Live' : 'Fallback', hint: 'Admin data source' }
  ];

  return (
    <AdminGuard>
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
              Monitor users, review reports, approve creators and track platform growth.
            </p>

            <div className="adminSearchRow">
              <input
                placeholder="Search users, reports, verification..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="button" onClick={loadAdminData}>
                Refresh
              </button>
            </div>
          </div>

          <div className="adminLiveCard">
            <b>Live API</b>
            <strong>{source === 'backend' ? 'Connected' : 'Fallback'}</strong>
            <p>{loading ? 'Loading...' : 'EC2 backend status'}</p>
          </div>
        </section>

        {message && <div className="adminActionMessage">{message}</div>}

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
              {filteredUsers.map((user: any) => (
                <div className="adminTableRow" key={user.id}>
                  <div>
                    <b>{user.name}</b>
                    <span>{user.username} • {user.role} • {user.email}</span>
                  </div>
                  <em>{user.status}</em>
                </div>
              ))}

              {!filteredUsers.length && <div className="adminEmpty">No users found.</div>}
            </div>
          </div>

          <div className="adminPanel">
            <div className="adminPanelHead">
              <h3>Reports Queue</h3>
              <button type="button" onClick={loadAdminData}>Reload</button>
            </div>

            <div className="adminTable">
              {filteredReports.map((report: any) => (
                <div className="adminTableRow adminTableActionRow" key={report.id}>
                  <div>
                    <b>{report.username}</b>
                    <span>{report.id} • {report.reason}</span>
                    <em>{report.status}</em>
                  </div>

                  <div className="adminActionButtons">
                    <button
                      type="button"
                      onClick={() => updateReportStatus(report.id, 'Review')}
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReportStatus(report.id, 'Resolved')}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}

              {!filteredReports.length && <div className="adminEmpty">No reports found.</div>}
            </div>
          </div>
        </section>

        <section className="adminGridTwo">
          <div className="adminPanel">
            <div className="adminPanelHead">
              <h3>Verification Requests</h3>
              <button type="button" onClick={loadAdminData}>Reload</button>
            </div>

            <div className="adminTable">
              {filteredVerification.map((item: any) => (
                <div className="adminTableRow adminTableActionRow" key={item.id}>
                  <div>
                    <b>{item.username}</b>
                    <span>{item.category} • {item.id}</span>
                    <em>{item.status}</em>
                  </div>

                  <div className="adminActionButtons">
                    <button
                      type="button"
                      onClick={() => updateVerificationStatus(item.id, 'Approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateVerificationStatus(item.id, 'Rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {!filteredVerification.length && <div className="adminEmpty">No verification requests found.</div>}
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
    </AdminGuard>
  );
}
