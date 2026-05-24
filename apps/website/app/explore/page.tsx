'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

const tags = ['#travel', '#fashion', '#startup', '#fitness', '#food', '#creator', '#music', '#tech'];

type Creator = {
  id: string;
  name: string;
  username: string;
  category: string;
  followers: number;
  isFollowing: boolean;
};

export default function ExplorePage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadCreators() {
    try {
      const response = await fetch('/api/creators', { cache: 'no-store' });
      const data = await response.json();

      setCreators(data.creators || []);
      setSource(data.source || 'fallback');
      localStorage.setItem('vibeloop_following_count', String(data.followingCount || 0));
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return creators;

    return creators.filter((creator) =>
      `${creator.name} ${creator.username} ${creator.category}`
        .toLowerCase()
        .includes(q)
    );
  }, [creators, query]);

  async function toggleFollow(creator: Creator) {
    const nextFollow = !creator.isFollowing;

    setCreators((prev) =>
      prev.map((item) =>
        item.id === creator.id
          ? {
              ...item,
              isFollowing: nextFollow,
              followers: nextFollow ? item.followers + 1 : Math.max(item.followers - 1, 0)
            }
          : item
      )
    );

    try {
      const response = await fetch('/api/creators/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: creator.id, follow: nextFollow })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Follow update failed');
      }

      setCreators((prev) =>
        prev.map((item) => (item.id === creator.id ? data.creator : item))
      );

      localStorage.setItem('vibeloop_following_count', String(data.followingCount || 0));
      setMessage(nextFollow ? `Following ${creator.name}` : `Unfollowed ${creator.name}`);
    } catch {
      setMessage('Live follow failed. UI updated locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="explore"
        title="Explore"
        subtitle="Discover trending creators, reels, hashtags and communities."
      >
        <div className="vlExploreHero">
          <h2>Discover what is trending now</h2>
          <p>
            Explore creators, viral reels, hashtags and fresh content.
            <span className="vlSourceBadge"> {source === 'platform' ? 'Live Live' : 'Ready Ready'}</span>
          </p>

          <div className="vlExploreSearch">
            <input
              placeholder="Search creators..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="vlExploreTags">
            {tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <div className="vlCreatorExploreGrid">
          {filteredCreators.map((creator) => (
            <article className="vlCreatorExploreCard" key={creator.id}>
              <div className="vlCreatorCover" />

              <div className="vlCreatorExploreAvatar">
                {creator.name[0]}
              </div>

              <h3>{creator.name}</h3>
              <p>{creator.username}</p>
              <span>{creator.category}</span>

              <div className="vlCreatorExploreStats">
                <b>{creator.followers.toLocaleString()}</b>
                <small>Followers</small>
              </div>

              <button
                type="button"
                className={creator.isFollowing ? 'following' : ''}
                onClick={() => toggleFollow(creator)}
              >
                {creator.isFollowing ? 'Following' : 'Follow'}
              </button>
            </article>
          ))}
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
