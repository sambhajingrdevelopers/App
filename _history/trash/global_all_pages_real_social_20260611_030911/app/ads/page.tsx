'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function AdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('₹5,000');
  const [status, setStatus] = useState('Scheduled');
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadAds() {
    try {
      const response = await fetch('/api/ads', { cache: 'no-store' });
      const data = await response.json();

      setAds(data.ads || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadAds();
  }, []);

  async function createAd() {
    if (!title.trim()) {
      setMessage('Campaign title is required.');
      return;
    }

    setMessage('Creating campaign...');

    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, budget, status })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Create failed');
      }

      setAds([data.ad, ...ads]);
      setTitle('');
      setBudget('₹5,000');
      setStatus('Scheduled');
      setMessage('Ad campaign created successfully.');
    } catch {
      setMessage('Ad create failed. Try again.');
    }
  }

  async function updateAd(ad: any, nextStatus: string, nextProgress: number) {
    setAds((prev) =>
      prev.map((item) =>
        item.id === ad.id ? { ...item, status: nextStatus, progress: nextProgress } : item
      )
    );

    try {
      const response = await fetch(`/api/ads/${ad.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, progress: nextProgress })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAds((prev) => prev.map((item) => item.id === ad.id ? data.ad : item));
      }

      setMessage(`Campaign ${nextStatus}.`);
    } catch {
      setMessage('Ad updated locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="ads"
        title="Ads Manager"
        subtitle="Create, run and monitor creator promotion campaigns."
      >
        <section className="adsHero">
          <div>
            <span>{source === 'platform' ? 'Live Live Ads' : 'Ready Ads Ready'}</span>
            <h2>Promote creators, reels and posts</h2>
            <p>Create campaigns, control budget and track ad progress.</p>
          </div>

          <button type="button" onClick={loadAds}>Refresh</button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="adsGrid">
          <div className="adsPanel">
            <h3>Create Campaign</h3>

            <label>
              Campaign Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Reel boost campaign"
              />
            </label>

            <label>
              Budget
              <input
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="₹5,000"
              />
            </label>

            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option>Scheduled</option>
                <option>Running</option>
                <option>Paused</option>
              </select>
            </label>

            <button type="button" onClick={createAd}>Create Campaign</button>
          </div>

          <div className="adsPanel">
            <h3>Campaign Summary</h3>

            <div className="adsSummary">
              <div>
                <b>{ads.length}</b>
                <span>Total Campaigns</span>
              </div>
              <div>
                <b>{ads.filter((ad) => ad.status === 'Running').length}</b>
                <span>Running</span>
              </div>
              <div>
                <b>{ads.filter((ad) => ad.status === 'Paused').length}</b>
                <span>Paused</span>
              </div>
            </div>
          </div>
        </section>

        <section className="adsPanel">
          <h3>All Campaigns</h3>

          <div className="adsList">
            {ads.map((ad) => (
              <article className="adsItem" key={ad.id}>
                <div className="adsItemMain">
                  <b>{ad.title}</b>
                  <span>{ad.status} • {ad.budget} budget</span>

                  <div className="adminProgress">
                    <span style={{ width: `${ad.progress || 0}%` }} />
                  </div>
                </div>

                <div className="adsActions">
                  <button type="button" onClick={() => updateAd(ad, 'Running', 75)}>Run</button>
                  <button type="button" onClick={() => updateAd(ad, 'Paused', ad.progress || 30)}>Pause</button>
                  <button type="button" onClick={() => updateAd(ad, 'Completed', 100)}>Complete</button>
                </div>
              </article>
            ))}

            {!ads.length && <div className="adminEmpty">No ad campaigns yet.</div>}
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
