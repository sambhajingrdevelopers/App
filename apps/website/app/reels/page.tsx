'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function ReelsPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [source, setSource] = useState('loading');

  async function loadReels() {
    try {
      const response = await fetch('/api/content/reels-live', {
        cache: 'no-store'
      });

      const data = await response.json();

      setReels(data.reels || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadReels();

    const timer = setInterval(loadReels, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AuthGuard>
      <SocialAppShell
        active="reels"
        title="Reels"
        subtitle="Auto-refreshing reel grid from platform."
      >
        <section className="liveHomeHero">
          <div>
            <span>{source === 'platform' ? 'Live Reels' : 'Fallback Reels Ready'}</span>
            <h2>Live reels</h2>
            <p>Every reel published from /create appears here.</p>
          </div>

          <button type="button" onClick={loadReels}>Refresh</button>
        </section>

        <section className="liveReelsGrid">
          {reels.map((reel) => (
            <a className="liveReelCard" href={`/reel/${encodeURIComponent(reel.id)}`} key={reel.id}>
              {reel.videoUrl ? (
                <video src={reel.videoUrl} muted />
              ) : (
                <div className={`liveReelFallback ${reel.color || ''}`}>▶</div>
              )}

              <section>
                <b>{reel.title}</b>
                <p>{reel.caption}</p>
                <span>{reel.views} views • {reel.likes} likes</span>
              </section>
            </a>
          ))}

          {!reels.length && <div className="adminEmpty">No reels yet. Upload one from /create.</div>}
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
