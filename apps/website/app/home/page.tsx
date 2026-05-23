'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadHome(silent = false) {
    if (!silent) setMessage('Refreshing live feed...');

    try {
      const response = await fetch('/api/content/home-live', {
        cache: 'no-store'
      });

      const data = await response.json();

      setPosts(data.posts || []);
      setStories(data.stories || []);
      setReels(data.reels || []);
      setSource(data.source || 'fallback');

      if (!silent) setMessage('Feed refreshed.');
    } catch {
      setSource('fallback');
      if (!silent) setMessage('Feed refresh failed.');
    }
  }

  useEffect(() => {
    loadHome(true);

    const timer = setInterval(() => {
      loadHome(true);
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  return (
    <AuthGuard>
      <SocialAppShell
        active="home"
        title="Home"
        subtitle="Live posts, reels and stories from secure storage."
      >
        <section className="liveHomeHero">
          <div>
            <span>{source === 'platform' ? 'Live Feed' : 'Fallback Feed Ready'}</span>
            <h2>Live social feed</h2>
            <p>New posts, reels and stories from /create appear here automatically.</p>
          </div>

          <button type="button" onClick={() => loadHome(false)}>Refresh</button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="liveStoryBar">
          <a className="liveCreateStory" href="/create">
            <b>＋</b>
            <span>Create</span>
          </a>

          {stories.map((story) => (
            <a className="liveStoryBubble" href={`/story/${encodeURIComponent(story.id)}`} key={story.id}>
              <div>
                {story.mediaUrl && story.mediaType !== 'video' ? (
                  <img src={story.mediaUrl} alt={story.name} />
                ) : (
                  <span>{story.name?.[0] || 'S'}</span>
                )}
              </div>
              <small>{story.name}</small>
            </a>
          ))}

          {!stories.length && <div className="adminEmpty">No stories yet.</div>}
        </section>

        <section className="liveReelStrip">
          <div className="liveSectionHead">
            <h3>Latest Reels</h3>
            <a href="/reels">View all</a>
          </div>

          <div className="liveReelCards">
            {reels.map((reel) => (
              <a className="liveReelMini" href={`/reel/${encodeURIComponent(reel.id)}`} key={reel.id}>
                {reel.videoUrl ? (
                  <video src={reel.videoUrl} muted />
                ) : (
                  <div>▶</div>
                )}
                <b>{reel.title}</b>
                <span>{reel.views} views</span>
              </a>
            ))}

            {!reels.length && <div className="adminEmpty">No reels yet.</div>}
          </div>
        </section>

        <section className="liveFeedList">
          <div className="liveSectionHead">
            <h3>Latest Posts</h3>
            <a href="/create">Create post</a>
          </div>

          {posts.map((post) => (
            <article className="livePostCard" key={post.id}>
              <div className="livePostHeader">
                <div>{post.name?.[0] || 'V'}</div>
                <section>
                  <b>{post.user} ✓</b>
                  <span>{post.location || 'VibeLoop'}</span>
                </section>
              </div>

              <a href={`/post/${encodeURIComponent(post.id)}`} className="livePostMedia">
                {post.mediaUrl ? (
                  post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls />
                  ) : (
                    <img src={post.mediaUrl} alt={post.title || post.caption} />
                  )
                ) : (
                  <div className={`livePostFallback ${post.color || ''}`}>
                    <h3>{post.title || 'Creator Post'}</h3>
                    <p>{post.caption}</p>
                  </div>
                )}
              </a>

              <div className="livePostInfo">
                <b>{post.title}</b>
                <p>{post.caption}</p>
                <span>♡ {post.likes} likes • 💬 {post.comments} comments</span>
              </div>
            </article>
          ))}

          {!posts.length && <div className="adminEmpty">No posts yet. Create first post from /create.</div>}
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
