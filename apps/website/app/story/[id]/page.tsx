'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import SocialAppShell from '../../../components/SocialAppShell';

export default function StoryViewerPage() {
  const params = useParams();
  const storyId = String(params.id || '');

  const [story, setStory] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  async function loadStory() {
    try {
      const response = await fetch(`/api/stories/${encodeURIComponent(storyId)}/detail`, {
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Story not found');
      }

      setStory(data.story);
      setReplies(data.replies || []);

      const viewResponse = await fetch(`/api/stories/${encodeURIComponent(storyId)}/view`, {
        method: 'POST'
      });

      const viewData = await viewResponse.json();

      if (viewResponse.ok && viewData.success) {
        setStory(viewData.story);
      }
    } catch {
      setMessage('Story not found or platform not ready.');
    }
  }

  useEffect(() => {
    if (storyId) loadStory();
  }, [storyId]);

  async function sendReply() {
    if (!text.trim()) {
      setMessage('Write reply first.');
      return;
    }

    const localText = text;
    setText('');

    const localReply = {
      id: Date.now(),
      storyId,
      user: '@you',
      text: localText,
      createdAt: new Date().toISOString()
    };

    setReplies((prev) => [...prev, localReply]);

    try {
      const response = await fetch(`/api/stories/${encodeURIComponent(storyId)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: '@you', text: localText })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReplies((prev) =>
          prev.map((item) => item.id === localReply.id ? data.reply : item)
        );
      }

      setMessage('Story reply sent.');
    } catch {
      setMessage('Reply saved locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="home"
        title="Story Viewer"
        subtitle="View stories, count views and send replies."
      >
        {message && <div className="vlSettingsMessage">{message}</div>}

        {!story && <div className="adminEmpty">Loading story...</div>}

        {story && (
          <section className="storyViewerLayout">
            <article className="storyPhone">
              {story.mediaUrl ? (
                story.mediaType === 'video' ? (
                  <video src={story.mediaUrl} controls autoPlay muted />
                ) : (
                  <img src={story.mediaUrl} alt={story.caption || story.name} />
                )
              ) : (
                <div className="storyReady">
                  <span>{story.name?.[0] || 'S'}</span>
                  <h2>{story.caption || 'Creator Story'}</h2>
                  <p>{story.username}</p>
                </div>
              )}

              <div className="storyTopBar">
                <div>{story.name?.[0] || 'S'}</div>
                <section>
                  <b>{story.name}</b>
                  <span>{story.username}</span>
                </section>
              </div>

              <div className="storyBottomInfo">
                <span>{story.views} views</span>
                <b>{story.caption}</b>
              </div>
            </article>

            <aside className="storyReplyPanel">
              <h2>Story Replies</h2>
              <p>Reply privately to this story and keep engagement saved on platform.</p>

              <div className="storyReplyComposer">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Write story reply..."
                />
                <button type="button" onClick={sendReply}>Send Reply</button>
              </div>

              <div className="storyReplies">
                {replies.map((item) => (
                  <article key={item.id}>
                    <b>{item.user}</b>
                    <p>{item.text}</p>
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}</span>
                  </article>
                ))}

                {!replies.length && <div className="adminEmpty">No replies yet.</div>}
              </div>
            </aside>
          </section>
        )}
      </SocialAppShell>
    </AuthGuard>
  );
}
