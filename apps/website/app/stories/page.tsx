'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function StoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [source, setSource] = useState('loading');

  async function loadStories() {
    try {
      const response = await fetch('/api/content/stories-live', {
        cache: 'no-store'
      });

      const data = await response.json();

      setStories(data.stories || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadStories();

    const timer = setInterval(loadStories, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AuthGuard>
      <SocialAppShell
        active="home"
        title="Stories"
        subtitle="Auto-refreshing story grid from platform."
      >
        <section className="liveHomeHero">
          <div>
            <span>{source === 'platform' ? 'Live Stories' : 'Fallback Stories Ready'}</span>
            <h2>Live stories</h2>
            <p>Every story published from /create appears here.</p>
          </div>

          <button type="button" onClick={loadStories}>Refresh</button>
        </section>

        <section className="liveStoriesGrid">
          {stories.map((story) => (
            <a className="liveStoryCard" href={`/story/${encodeURIComponent(story.id)}`} key={story.id}>
              {story.mediaUrl ? (
                story.mediaType === 'video' ? (
                  <video src={story.mediaUrl} muted />
                ) : (
                  <img src={story.mediaUrl} alt={story.name} />
                )
              ) : (
                <div>{story.name?.[0] || 'S'}</div>
              )}

              <section>
                <b>{story.name}</b>
                <p>{story.caption}</p>
                <span>{story.views} views • {story.username}</span>
              </section>
            </a>
          ))}

          {!stories.length && <div className="adminEmpty">No stories yet. Upload one from /create.</div>}
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
