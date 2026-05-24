'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type Post = {
  id: string | number;
  user: string;
  name: string;
  location: string;
  title: string;
  caption: string;
  likes: string;
  comments: string;
  color: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  saved?: boolean;
};

export default function SavedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadSavedPosts() {
    try {
      const response = await fetch('/api/saved-posts', { cache: 'no-store' });
      const data = await response.json();

      const platformPosts = data.posts || [];

      let localSaved: Post[] = [];

      try {
        const localPosts = JSON.parse(localStorage.getItem('vibeloop_posts') || '[]');
        localSaved = localPosts.filter((post: Post) => post.saved);
      } catch {
        localSaved = [];
      }

      const merged = [...localSaved, ...platformPosts].filter(
        (post, index, arr) => arr.findIndex((item) => String(item.id) === String(post.id)) === index
      );

      setPosts(merged);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadSavedPosts();
  }, []);

  async function removeSaved(postId: string | number) {
    const updated = posts.filter((post) => String(post.id) !== String(postId));
    setPosts(updated);

    try {
      const localPosts = JSON.parse(localStorage.getItem('vibeloop_posts') || '[]');
      const nextLocal = localPosts.map((post: Post) =>
        String(post.id) === String(postId) ? { ...post, saved: false } : post
      );

      localStorage.setItem('vibeloop_posts', JSON.stringify(nextLocal));
    } catch {
      // local cleanup skipped
    }

    try {
      await fetch(`/api/posts/${encodeURIComponent(String(postId))}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved: false })
      });

      setMessage('Post removed from saved.');
    } catch {
      setMessage('Post removed locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="saved"
        title="Saved Posts"
        subtitle="View all bookmarked posts and creator content."
      >
        <div className="vlNotificationTopActions">
          <span>{source === 'platform' ? 'Live Live Saved Posts' : 'Saved Posts Ready'}</span>
          <button type="button" onClick={loadSavedPosts}>Refresh</button>
        </div>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="vlSavedGrid">
          {posts.map((post) => (
            <article className="vlPostCard" key={post.id}>
              <div className="vlPostHeader">
                <div className={`vlAvatar ${post.color}`}>{post.name?.[0] || 'V'}</div>
                <div>
                  <b>{post.user} ✓</b>
                  <span>{post.location}</span>
                </div>
                <button type="button" onClick={() => removeSaved(post.id)}>
                  Unsave
                </button>
              </div>

              {post.mediaUrl ? (
                <div className="vlUploadedPostMedia">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls />
                  ) : (
                    <img src={post.mediaUrl} alt={post.title} />
                  )}
                </div>
              ) : (
                <div className={`vlPostMedia ${post.color}`}>
                  <h2>{post.title}</h2>
                  <p>{post.caption}</p>
                </div>
              )}

              <div className="vlPostCaption">
                <b>{post.user}</b> {post.caption}
              </div>

              <div className="vlPostActions">
                <span>♡ {post.likes}</span>
                <span>💬 {post.comments}</span>
                <span>🔖 Saved</span>
              </div>
            </article>
          ))}
        </section>

        {!posts.length && (
          <div className="adminEmpty">
            No saved posts yet. Go to Home and tap Save on any post.
          </div>
        )}
      </SocialAppShell>
    </AuthGuard>
  );
}
