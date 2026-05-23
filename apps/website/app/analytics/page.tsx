'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

function formatNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value || 0);
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [source, setSource] = useState('loading');

  async function loadAnalytics() {
    try {
      const response = await fetch('/api/analytics', { cache: 'no-store' });
      const data = await response.json();

      setAnalytics(data.analytics);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const a = analytics || {};
  const growth = a.growth || [];

  const stats = [
    { label: 'Profile Views', value: formatNumber(a.profileViews), hint: 'Total profile reach' },
    { label: 'Followers', value: formatNumber(a.followers), hint: `${a.following || 0} following` },
    { label: 'Posts', value: String(a.totalPosts || 0), hint: `${a.savedPosts || 0} saved` },
    { label: 'Likes', value: formatNumber(a.totalLikes), hint: `${formatNumber(a.totalComments)} comments` },
    { label: 'Reels Views', value: formatNumber(a.reelViews), hint: `${a.totalReels || 0} reels` },
    { label: 'Stories Views', value: formatNumber(a.storyViews), hint: `${a.totalStories || 0} stories` },
    { label: 'Engagement', value: `${a.engagementRate || 0}%`, hint: 'Average rate' },
    { label: 'API Source', value: source === 'platform' ? 'Live' : 'Fallback', hint: 'Analytics data' }
  ];

  return (
    <AuthGuard>
      <SocialAppShell
        active="analytics"
        title="Analytics"
        subtitle="Track profile growth, content reach, followers and engagement."
      >
        <section className="analyticsHero">
          <div>
            <span>{source === 'platform' ? 'Live Live Analytics' : 'Fallback Analytics Ready'}</span>
            <h2>Creator performance dashboard</h2>
            <p>
              Monitor posts, reels, stories, followers, profile views and content engagement.
            </p>
          </div>

          <button type="button" onClick={loadAnalytics}>
            Refresh Analytics
          </button>
        </section>

        <section className="analyticsStatsGrid">
          {stats.map((item) => (
            <article className="analyticsStatCard" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.hint}</p>
            </article>
          ))}
        </section>

        <section className="analyticsChartCard">
          <div className="analyticsChartHead">
            <h3>Weekly Growth</h3>
            <p>Views, likes and follower growth this week.</p>
          </div>

          <div className="analyticsBars">
            {growth.map((item: any) => {
              const height = Math.max(20, Math.min(100, Math.round((item.views / 10000) * 100)));

              return (
                <div className="analyticsBarItem" key={item.label}>
                  <div className="analyticsBarTrack">
                    <span style={{ height: `${height}%` }} />
                  </div>
                  <b>{item.label}</b>
                  <small>{formatNumber(item.views)}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="analyticsGridTwo">
          <div className="analyticsPanel">
            <h3>Top Insights</h3>

            <div className="analyticsInsight">
              <b>Reels are your strongest content format</b>
              <span>Short videos are driving the highest reach and discovery.</span>
            </div>

            <div className="analyticsInsight">
              <b>Saved posts show strong audience interest</b>
              <span>Users are bookmarking your content for later.</span>
            </div>

            <div className="analyticsInsight">
              <b>Follower growth is stable</b>
              <span>Continue posting daily reels and stories.</span>
            </div>
          </div>

          <div className="analyticsPanel">
            <h3>Recommended Actions</h3>

            <div className="analyticsAction">Post 2 reels daily for better reach.</div>
            <div className="analyticsAction">Add story polls to increase engagement.</div>
            <div className="analyticsAction">Reply to comments within first 30 minutes.</div>
            <div className="analyticsAction">Use creator search trends for content ideas.</div>
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
