'use client';

import { useEffect, useRef, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type Reel = {
  id: string;
  title: string;
  creator: string;
  caption: string;
  videoUrl: string;
  views: string;
  likes: string;
  comments: string;
  color: string;
};

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  async function loadReels() {
    try {
      const response = await fetch('/api/reels', { cache: 'no-store' });
      const data = await response.json();

      setReels(data.reels || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadReels();
  }, []);

  async function uploadVideo(file: File) {
    if (!file.type.startsWith('video/')) {
      setMessage('Please upload only video file for reel.');
      return;
    }

    setUploading(true);
    setMessage('Uploading reel video...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.message || 'Video upload failed');
      }

      setVideoUrl(result.mediaUrl);
      setMessage('Video uploaded successfully.');
    } catch {
      setMessage('Video upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  async function publishReel() {
    if (!title.trim() || !videoUrl) {
      setMessage('Title and video are required.');
      return;
    }

    const newReel = {
      id: `LOCAL-${Date.now()}`,
      title,
      creator: '@you',
      caption,
      videoUrl,
      views: '0',
      likes: '0',
      comments: '0',
      color: 'pink'
    };

    setReels([newReel, ...reels]);
    setTitle('');
    setCaption('');
    setVideoUrl('');
    setMessage('Publishing reel...');

    try {
      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReel)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Reel publish failed');
      }

      setMessage('Reel saved to backend.');
      loadReels();
    } catch {
      setMessage('Backend failed. Reel added locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="reels"
        title="Reels"
        subtitle="Short videos, creator moments and viral discovery."
      >
        <div className="vlMessagesStatus">
          <span>{source === 'backend' ? 'Live Backend Reels' : 'Fallback Reels Ready'}</span>
          {message && <b>{message}</b>}
        </div>

        <section className="vlReelComposer">
          <div>
            <h2>Create Reel</h2>
            <p>Upload vertical video and publish your creator reel.</p>
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Reel title"
          />

          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Write reel caption..."
          />

          {videoUrl && (
            <div className="vlReelPreview">
              <video src={videoUrl} controls />
            </div>
          )}

          <div className="vlComposerActions">
            <button
              className="vlMediaBtn"
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Reel Video'}
            </button>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadVideo(file);
              }}
            />

            <button className="vlPostBtn" type="button" onClick={publishReel}>
              Publish Reel
            </button>
          </div>
        </section>

        <div className="vlReelsWall">
          {reels.map((reel, index) => (
            <div
              className={`vlReelBig ${
                reel.color === 'blue' ? 'blue' : reel.color === 'purple' ? 'purple' : ''
              }`}
              key={reel.id}
            >
              {reel.videoUrl ? (
                <video className="vlReelVideo" src={reel.videoUrl} controls />
              ) : (
                <div className="vlPlayBig">▶</div>
              )}

              <div className="vlReelText">
                <b>{reel.creator}</b>
                <h2>{reel.title}</h2>
                <span>{reel.views} views</span>
                <p>{reel.caption}</p>
              </div>

              <div className="vlReelSide">
                <span>♡</span>
                <span>💬</span>
                <span>↗</span>
              </div>
            </div>
          ))}
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
