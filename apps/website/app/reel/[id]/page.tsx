'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import SocialAppShell from '../../../components/SocialAppShell';

export default function ReelDetailPage() {
  const params = useParams();
  const reelId = String(params.id || '');

  const [reel, setReel] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  async function loadReel() {
    try {
      const response = await fetch(`/api/reels/${encodeURIComponent(reelId)}/detail`, {
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Reel not found');
      }

      setReel(data.reel);
      setComments(data.comments || []);

      fetch(`/api/reels/${encodeURIComponent(reelId)}/view`, {
        method: 'POST'
      }).catch(() => {});
    } catch {
      setMessage('Reel not found or platform not ready.');
    }
  }

  useEffect(() => {
    if (reelId) loadReel();
  }, [reelId]);

  async function toggleLike() {
    if (!reel) return;

    const nextLiked = !reel.liked;

    setReel({ ...reel, liked: nextLiked });

    try {
      const response = await fetch(`/api/reels/${encodeURIComponent(reelId)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liked: nextLiked })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReel(data.reel);
      }

      setMessage(nextLiked ? 'Reel liked.' : 'Reel unliked.');
    } catch {
      setMessage('Like updated locally.');
    }
  }

  async function addComment() {
    if (!text.trim()) {
      setMessage('Write a comment first.');
      return;
    }

    const localText = text;
    setText('');

    const localComment = {
      id: Date.now(),
      user: '@you',
      text: localText,
      createdAt: new Date().toISOString()
    };

    setComments((prev) => [...prev, localComment]);

    try {
      const response = await fetch(`/api/reels/${encodeURIComponent(reelId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: localText, user: '@you' })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setComments((prev) =>
          prev.map((item) => item.id === localComment.id ? data.comment : item)
        );
        setReel(data.reel);
      }

      setMessage('Comment added.');
    } catch {
      setMessage('Comment added locally.');
    }
  }

  async function shareReel() {
    const reelUrl = `${window.location.origin}/reel/${encodeURIComponent(reelId)}`;

    try {
      await navigator.clipboard.writeText(reelUrl);
    } catch {
      // clipboard not available
    }

    try {
      const response = await fetch(`/api/reels/${encodeURIComponent(reelId)}/share`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReel(data.reel);
      }

      setMessage('Reel link copied and share saved.');
    } catch {
      setMessage('Reel link copied locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="reels"
        title="Reel Detail"
        subtitle="Watch, like, comment and share creator reels."
      >
        {message && <div className="vlSettingsMessage">{message}</div>}

        {!reel && <div className="adminEmpty">Loading reel...</div>}

        {reel && (
          <section className="reelDetailLayout">
            <article className="reelWatchCard">
              {reel.videoUrl ? (
                <video src={reel.videoUrl} controls autoPlay muted />
              ) : (
                <div className={`reelFallback ${reel.color || ''}`}>
                  <span>▶</span>
                  <h2>{reel.title}</h2>
                  <p>{reel.caption}</p>
                </div>
              )}

              <div className="reelOverlayInfo">
                <b>{reel.creator}</b>
                <span>{reel.caption}</span>
              </div>
            </article>

            <aside className="reelSidePanel">
              <div className="reelInfoBox">
                <h2>{reel.title}</h2>
                <p>{reel.caption}</p>

                <div className="reelMetrics">
                  <span>{reel.views} views</span>
                  <span>{reel.likes} likes</span>
                  <span>{comments.length} comments</span>
                  <span>{reel.shareCount || 0} shares</span>
                </div>

                <div className="reelActions">
                  <button type="button" onClick={toggleLike}>
                    {reel.liked ? '♥ Liked' : '♡ Like'}
                  </button>
                  <button type="button" onClick={shareReel}>↗ Share</button>
                </div>
              </div>

              <div className="reelCommentBox">
                <h3>Comments</h3>

                <div className="reelComposer">
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Write comment..."
                  />
                  <button type="button" onClick={addComment}>Post</button>
                </div>

                <div className="reelComments">
                  {comments.map((item) => (
                    <article key={item.id}>
                      <b>{item.user}</b>
                      <p>{item.text}</p>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}</span>
                    </article>
                  ))}

                  {!comments.length && <div className="adminEmpty">No comments yet.</div>}
                </div>
              </div>
            </aside>
          </section>
        )}
      </SocialAppShell>
    </AuthGuard>
  );
}
