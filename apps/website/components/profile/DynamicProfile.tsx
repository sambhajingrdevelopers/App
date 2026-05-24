'use client';

import { useEffect, useState } from 'react';

type Props = {
  username?: string;
  publicMode?: boolean;
};

function formatNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value || 0);
}

export default function DynamicProfile({ username = '@you' }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'stories'>('posts');
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');
  const [connectionModal, setConnectionModal] = useState<null | 'followers' | 'following'>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  async function loadProfile() {
    try {
      const response = await fetch(
        `/api/profile-dynamic?username=${encodeURIComponent(username)}`,
        { cache: 'no-store' }
      );

      const data = await response.json();

      setProfile(data.profile);
      setPosts(data.posts || []);
      setReels(data.reels || []);
      setStories(data.stories || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  async function loadConnections(type: 'followers' | 'following') {
    setConnectionModal(type);

    try {
      const response = await fetch(
        `/api/profile-connections?username=${encodeURIComponent(profile?.username || username)}`,
        { cache: 'no-store' }
      );

      const data = await response.json();

      setFollowers(data.followers || []);
      setFollowing(data.following || []);
    } catch {
      setFollowers([]);
      setFollowing([]);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function followProfile() {
    if (!profile?.username || profile.isOwn) return;

    const nextFollow = !profile.isFollowing;

    setProfile({
      ...profile,
      isFollowing: nextFollow,
      stats: {
        ...profile.stats,
        followers: nextFollow
          ? (profile.stats?.followers || 0) + 1
          : Math.max((profile.stats?.followers || 0) - 1, 0)
      }
    });

    try {
      const response = await fetch('/api/profile-follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username, follow: nextFollow })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Follow update failed');
      }

      setProfile((current: any) => ({
        ...current,
        isFollowing: data.creator.isFollowing,
        stats: {
          ...current.stats,
          followers: data.creator.followers,
          following: data.followingCount
        }
      }));

      setMessage(nextFollow ? 'Profile followed successfully.' : 'Profile unfollowed.');
    } catch {
      setMessage('Follow failed on platform. UI updated locally.');
    }
  }

  const [profileCounts, setProfileCounts] = useState({
    posts: 0,
    reels: 0,
    stories: 0,
    followers: 0
  });

  useEffect(() => {
    async function loadProfileCounts() {
      try {
        const username = profile?.username || '@you';

        const response = await fetch(
          `/api/profile-counts?username=${encodeURIComponent(username)}`,
          { cache: 'no-store' }
        );

        const data = await response.json();

        if (data.success && data.counts) {
          setProfileCounts({
            posts: Number(data.counts.posts || 0),
            reels: Number(data.counts.reels || 0),
            stories: Number(data.counts.stories || 0),
            followers: Number(data.counts.followers || 0)
          });
        }
      } catch {
        // keep fallback counts
      }
    }

    loadProfileCounts();
  }, [profile?.username]);

  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    async function loadTrashCount() {
      try {
        const response = await fetch('/api/trash', { cache: 'no-store' });
        const data = await response.json();

        if (data.success) {
          setTrashCount(Number(data.total || data.items?.length || 0));
        }
      } catch {
        setTrashCount(0);
      }
    }

    loadTrashCount();
  }, []);

  const p = profile || {
    displayName: 'VibeLoop Creator',
    username: '@you',
    bio: 'Digital creator • Reels • Stories',
    avatarUrl: '',
    bannerUrl: '',
    isOwn: true,
    stats: {}
  };

  const initial = p.displayName?.[0]?.toUpperCase() || 'V';
  const modalList = connectionModal === 'followers' ? followers : following;

  useEffect(() => {
    async function loadRealProfileContent() {
      try {
        const username = profile?.username || '@you';

        const response = await fetch(
          `/api/profile-content?username=${encodeURIComponent(username)}`,
          { cache: 'no-store' }
        );

        const data = await response.json();

        if (data.success) {
          setPosts(data.posts || []);
          setReels(data.reels || []);
          setStories(data.stories || []);
        }
      } catch {
        // keep current profile content
      }
    }

    loadRealProfileContent();
  }, [profile?.username]);



  return (
    <div className="dpPage">
      <div
        className="dpBanner"
        style={{ backgroundImage: p.bannerUrl ? `url(${p.bannerUrl})` : undefined }}
      />

      <section className="dpHeader">
        <div
          className="dpAvatar"
          style={{ backgroundImage: p.avatarUrl ? `url(${p.avatarUrl})` : undefined }}
        >
          {!p.avatarUrl && initial}
        </div>

        <div className="dpIdentity">
          <div className="dpNameLine">
            <h2>{p.displayName}</h2>
            <span>✓</span>
          </div>

          <p>{p.username}</p>
          <small>{p.bio}</small>

          <div className="dpSource">
            {source === 'platform' ? 'Verified Creator Profile' : 'Fallback Profile Ready'}
          </div>
        </div>

        <div className="dpActions">
          {p.isOwn ? (
            <a href="/edit-profile">Edit Profile</a>
          ) : (
            <button type="button" onClick={followProfile}>
              {p.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}

          <a href="/messages">Message</a>
          <a href="/trash">Trash {trashCount > 0 ? `(${trashCount})` : ``}</a>
        </div>
      </section>

      {message && <div className="vlSettingsMessage">{message}</div>}

      <section className="dpStats">
        <div>
          <b>{formatNumber(profileCounts.posts)}</b>
          <span>Posts</span>
        </div>
        <div>
          <b>{formatNumber(profileCounts.reels)}</b>
          <span>Reels</span>
        </div>
        <div>
          <b>{formatNumber(profileCounts.stories)}</b>
          <span>Stories</span>
        </div>
        <button type="button" onClick={() => loadConnections('followers')}>
          <b>{formatNumber(profileCounts.followers)}</b>
          <span>Followers</span>
        </button>
        <button type="button" onClick={() => loadConnections('following')}>
          <b>{formatNumber(p.stats?.following || 0)}</b>
          <span>Following</span>
        </button>
        <div>
          <b>{formatNumber(p.stats?.saved || 0)}</b>
          <span>Saved</span>
        </div>
      </section>

      <section className="dpTabs">
        <button type="button" className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
          Posts
        </button>
        <button type="button" className={activeTab === 'reels' ? 'active' : ''} onClick={() => setActiveTab('reels')}>
          Reels
        </button>
        <button type="button" className={activeTab === 'stories' ? 'active' : ''} onClick={() => setActiveTab('stories')}>
          Stories
        </button>
      </section>

      {activeTab === 'posts' && (
        <section className="dpGrid">
          {posts.map((post) => (
            <a className="dpPostCard" href={`/post/${encodeURIComponent(String(post.id))}`} key={post.id}>
              {post.mediaUrl ? (
                <div className="dpMedia">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls />
                  ) : (
                    <img src={post.mediaUrl} alt={post.title || post.caption} />
                  )}
                </div>
              ) : (
                <div className={`dpFallbackMedia ${post.color || ''}`}>
                  <h3>{post.title || 'Creator Post'}</h3>
                  <p>{post.caption}</p>
                </div>
              )}

              <div className="dpPostInfo">
                <b>{post.user}</b>
                <span>♡ {post.likes} • 💬 {post.comments}</span>
              </div>
            </a>
          ))}

          {!posts.length && <div className="adminEmpty">No posts found for this profile.</div>}
        </section>
      )}

      {activeTab === 'reels' && (
        <section className="dpGrid reels">
          {reels.map((reel) => (
            <article className="dpReelCard" key={reel.id}>
              {reel.videoUrl ? <video src={reel.videoUrl} controls /> : <div className="dpPlay">▶</div>}

              <div>
                <b>{reel.title}</b>
                <span>{reel.views} views</span>
              </div>
            </article>
          ))}

          {!reels.length && <div className="adminEmpty">No reels found for this profile.</div>}
        </section>
      )}

      {activeTab === 'stories' && (
        <section className="dpGrid stories">
          {stories.map((story) => (
            <article className="dpStoryCard" key={story.id}>
              {story.mediaUrl ? (
                story.mediaType === 'video' ? (
                  <video src={story.mediaUrl} controls />
                ) : (
                  <img src={story.mediaUrl} alt={story.caption || story.name} />
                )
              ) : (
                <div>{story.name?.[0] || 'S'}</div>
              )}

              <b>{story.caption || 'Story'}</b>
              <span>{story.views} views</span>
            </article>
          ))}

          {!stories.length && <div className="adminEmpty">No stories found for this profile.</div>}
        </section>
      )}

      {connectionModal && (
        <div className="dpModalOverlay">
          <section className="dpModal">
            <div className="dpModalHead">
              <h3>{connectionModal === 'followers' ? 'Followers' : 'Following'}</h3>
              <button type="button" onClick={() => setConnectionModal(null)}>×</button>
            </div>

            <div className="dpConnectionList">
              {modalList.map((item) => (
                <a
                  className="dpConnectionItem"
                  href={`/u/${encodeURIComponent(String(item.username || '').replace('@', ''))}`}
                  key={item.id}
                >
                  <div>{item.name?.[0] || 'C'}</div>
                  <section>
                    <b>{item.name}</b>
                    <span>{item.username} • {item.category}</span>
                    <small>{formatNumber(item.followers || 0)} followers</small>
                  </section>
                </a>
              ))}

              {!modalList.length && <div className="adminEmpty">No users found.</div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
