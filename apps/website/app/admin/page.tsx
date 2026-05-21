'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type AdminPost = {
  id: string | number;
  user: string;
  title: string;
  caption: string;
  likes: string;
  comments: string;
};

const reports = [
  {
    id: 'RPT-101',
    user: '@unknown.user',
    reason: 'Spam content',
    status: 'Pending'
  },
  {
    id: 'RPT-102',
    user: '@fake.brand',
    reason: 'Fake business account',
    status: 'Review'
  },
  {
    id: 'RPT-103',
    user: '@reel.copy',
    reason: 'Copyright issue',
    status: 'Pending'
  }
];

const verification = [
  {
    id: 'VR-301',
    user: '@mira.creates',
    category: 'Digital Creator',
    status: 'Pending'
  },
  {
    id: 'VR-302',
    user: '@travel.dev',
    category: 'Travel Creator',
    status: 'Approved'
  },
  {
    id: 'VR-303',
    user: '@styleloop',
    category: 'Fashion Brand',
    status: 'Pending'
  }
];

export default function AdminPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [source, setSource] = useState('loading');

  useEffect(() => {
    async function loadAdminData() {
      try {
        const response = await fetch('/api/feed', { cache: 'no-store' });
        const data = await response.json();

        setPosts(data.posts || []);
        setSource(data.source || 'fallback');
      } catch {
        setPosts([]);
        setSource('fallback');
      }
    }

    loadAdminData();
  }, []);

  const stats = [
    { label: 'Total Users', value: '52.8K', hint: '+12% this week' },
    { label: 'Total Posts', value: String(posts.length), hint: source === 'backend' ? 'Backend live' : 'Fallback mode' },
    { label: 'Reports', value: String(reports.length), hint: 'Needs review' },
    { label: 'Verification', value: String(verification.length), hint: 'Creator requests' },
    { label: 'Ads Revenue', value: '₹48,920', hint: 'This month' },
    { label: 'System Health', value: '99%', hint: 'Stable' }
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
              <h3>Post Management</h3>
              <button type="button">View All</button>
            </div>

            <div className="adminTable">
              {posts.slice(0, 5).map((post) => (
                <div className="adminTableRow" key={post.id}>
                  <div>
                    <b>{post.title || 'Creator Post'}</b>
                    <span>{post.user} • {post.caption?.slice(0, 45) || 'No caption'}...</span>
                  </div>
                  <button type="button">Review</button>
                </div>
              ))}

              {!posts.length && (
                <div className="adminEmpty">No posts loaded yet.</div>
              )}
            </div>
          </div>

          <div className="adminPanel">
            <div className="adminPanelHead">
              <h3>Reports Queue</h3>
              <button type="button">Moderate</button>
            </div>

            <div className="adminTable">
              {reports.map((report) => (
                <div className="adminTableRow" key={report.id}>
                  <div>
                    <b>{report.user}</b>
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
              {verification.map((item) => (
                <div className="adminTableRow" key={item.id}>
                  <div>
                    <b>{item.user}</b>
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

            <div className="adminCampaign">
              <div>
                <b>Creator Boost Campaign</b>
                <span>Running • ₹12,500 budget</span>
              </div>
              <div className="adminProgress"><span /></div>
            </div>

            <div className="adminCampaign">
              <div>
                <b>Reels Discovery Campaign</b>
                <span>Scheduled • ₹8,000 budget</span>
              </div>
              <div className="adminProgress small"><span /></div>
            </div>
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
