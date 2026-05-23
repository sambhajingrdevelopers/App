'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import SocialAppShell from '../../../components/SocialAppShell';

export default function PostDetailPage() {
  const params = useParams();
  const postId = String(params.id || '');
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [shareCount, setShareCount] = useState(0);
  const [source, setSource] = useState('loading');

  async function loadPost() {
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/detail`, {
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Post not found');
      }

      setPost(data.post);
      setComments(data.comments || []);
      setSource(data.source || 'platform');

      try {
        const shareResponse = await fetch(`/api/posts/${encodeURIComponent(postId)}/share`, {
          cache: 'no-store'
        });
        const shareData = await shareResponse.json();
        setShareCount(shareData.shareCount || 0);
      } catch {
        setShareCount(0);
      }
    } catch {
      setSource('not-found');
      setMessage('Post not found or platform not ready.');
    }
  }

  useEffect(() => {
    if (postId) loadPost();
  }, [postId]);


  async function sharePost() {
    const postUrl = `${window.location.origin}/post/${encodeURIComponent(postId)}`;

    try {
      await navigator.clipboard.writeText(postUrl);
    } catch {
      // clipboard not available
    }

    setShareCount((count) => count + 1);

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedBy: '@you', platform: 'copy-link' })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShareCount(data.shareCount || shareCount + 1);
      }

      setMessage('Post link copied and share saved.');
    } catch {
      setMessage('Post link copied locally.');
    }
  }

  async function addComment() {
    if (!text.trim()) {
      setMessage('Write a comment first.');
      return;
    }

    const commentText = text;
    setText('');

    const localComment = {
      id: Date.now(),
      user: '@you',
      text: commentText,
      createdAt: new Date().toISOString()
    };

    setComments((prev) => [...prev, localComment]);

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText, user: '@you' })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Comment failed');
      }

      setPost(data.post);
      setComments(data.post?.commentList || [...comments, data.comment]);
      setMessage('Comment added.');
    } catch {
      setMessage('Live failed. Comment added locally.');
    }
  }

  async function deleteComment(commentId: string | number) {
    const nextComments = comments.filter((item) => String(item.id) !== String(commentId));
    setComments(nextComments);

    try {
      const response = await fetch(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(String(commentId))}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setComments(data.comments || []);
        setPost(data.post || post);
      }

      setMessage('Comment deleted.');
    } catch {
      setMessage('Comment deleted locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="home"
        title="Post Detail"
        subtitle="View post, comments and discussion."
      >
        {message && <div className="vlSettingsMessage">{message}</div>}

        {!post && (
          <div className="adminEmpty">
            {source === 'not-found' ? 'Post not found.' : 'Loading post...'}
          </div>
        )}

        {post && (
          <section className="postDetailLayout">
            <article className="postDetailCard">
              <div className="vlPostHeader">
                <div className={`vlAvatar ${post.color}`}>{post.name?.[0] || 'V'}</div>
                <div>
                  <b>{post.user} ✓</b>
                  <span>{post.location || 'VibeLoop'}</span>
                </div>
              </div>

              {post.mediaUrl ? (
                <div className="postDetailMedia">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls />
                  ) : (
                    <img src={post.mediaUrl} alt={post.title || post.caption} />
                  )}
                </div>
              ) : (
                <div className={`postDetailFallback ${post.color || ''}`}>
                  <h2>{post.title || 'Creator Post'}</h2>
                  <p>{post.caption}</p>
                </div>
              )}

              <div className="postDetailCaption">
                <b>{post.user}</b> {post.caption}
              </div>

              <div className="postDetailMetrics">
                <span>♡ {post.likes} likes</span>
                <span>💬 {comments.length} comments</span>
                <span>🔖 {post.saved ? 'Saved' : 'Save'}</span>
                <button type="button" onClick={sharePost}>↗ Share {shareCount}</button>
              </div>
            </article>

            <aside className="commentsPanel">
              <div className="commentsHead">
                <h3>Comments</h3>
                <span>{comments.length}</span>
              </div>

              <div className="commentComposer">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Write your comment..."
                />

                <button type="button" onClick={addComment}>
                  Post Comment
                </button>
              </div>

              <div className="commentsList">
                {comments.map((item) => (
                  <article className="commentItem" key={item.id}>
                    <div>
                      <b>{item.user}</b>
                      <p>{item.text}</p>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}</span>
                    </div>

                    <button type="button" onClick={() => deleteComment(item.id)}>Delete</button>
                  </article>
                ))}

                {!comments.length && (
                  <div className="adminEmpty">No comments yet. Be first to comment.</div>
                )}
              </div>
            </aside>
          </section>
        )}
      </SocialAppShell>
    </AuthGuard>
  );
}
