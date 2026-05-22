'use client';

import { useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type ContentType = 'post' | 'reel' | 'story';

export default function CreatePage() {
  const [type, setType] = useState<ContentType>('post');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('VibeLoop');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  async function uploadFile(file: File) {
    setUploading(true);
    setMessage('Uploading media to EC2 permanent storage...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      setMediaUrl(data.mediaUrl);
      setMediaType(data.mediaType === 'video' ? 'video' : 'image');
      setMessage('Media uploaded permanently. Now publish content.');
    } catch (error: any) {
      setMessage(error?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function publishContent() {
    if (!caption.trim() && !title.trim()) {
      setMessage('Add title or caption first.');
      return;
    }

    if ((type === 'reel' || type === 'story') && !mediaUrl) {
      setMessage(type === 'reel' ? 'Upload video for reel first.' : 'Upload image/video for story first.');
      return;
    }

    setCreating(true);
    setMessage('Publishing content...');

    const payload = {
      title: title || (type === 'post' ? 'New Post' : type === 'reel' ? 'New Reel' : 'New Story'),
      caption,
      location,
      mediaUrl,
      mediaType,
      username: '@you',
      name: 'VibeLoop Creator',
      color: type === 'post' ? 'pink' : type === 'reel' ? 'purple' : 'orange'
    };

    try {
      const response = await fetch(`/api/content/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Publish failed');
      }

      setMessage(`${type.toUpperCase()} published successfully.`);

      if (type === 'post') {
        window.location.href = `/post/${encodeURIComponent(data.post.id)}`;
      } else if (type === 'reel') {
        window.location.href = `/reel/${encodeURIComponent(data.reel.id)}`;
      } else {
        window.location.href = `/story/${encodeURIComponent(data.story.id)}`;
      }
    } catch (error: any) {
      setMessage(error?.message || 'Publish failed.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="create"
        title="Create"
        subtitle="Upload posts, reels and stories with permanent EC2 media URLs."
      >
        <section className="createHero">
          <div>
            <span>Permanent Upload Studio</span>
            <h2>Create real social content</h2>
            <p>Upload media once, save it permanently on EC2, then publish post, reel or story.</p>
          </div>

          <button type="button" onClick={publishContent} disabled={creating}>
            {creating ? 'Publishing...' : 'Publish'}
          </button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="createTabs">
          <button type="button" className={type === 'post' ? 'active' : ''} onClick={() => setType('post')}>
            Post
          </button>
          <button type="button" className={type === 'reel' ? 'active' : ''} onClick={() => setType('reel')}>
            Reel
          </button>
          <button type="button" className={type === 'story' ? 'active' : ''} onClick={() => setType('story')}>
            Story
          </button>
        </section>

        <section className="createGrid">
          <div className="createPanel">
            <h3>Content Details</h3>

            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter title..." />
            </label>

            <label>
              Caption
              <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Write caption..." />
            </label>

            {type === 'post' && (
              <label>
                Location
                <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location..." />
              </label>
            )}

            <label>
              Media URL
              <input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="Upload media or paste URL..." />
            </label>

            <button type="button" onClick={publishContent} disabled={creating}>
              {creating ? 'Publishing...' : `Publish ${type}`}
            </button>
          </div>

          <div className="createPanel">
            <h3>Upload Media</h3>

            <label className="createUploader">
              <input
                type="file"
                accept={type === 'post' ? 'image/*,video/*' : type === 'reel' ? 'video/*' : 'image/*,video/*'}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />

              <div>
                <b>{uploading ? 'Uploading...' : 'Choose File'}</b>
                <span>Image/video will be saved permanently on EC2.</span>
              </div>
            </label>

            <div className="createPreview">
              {mediaUrl ? (
                mediaType === 'video' ? (
                  <video src={mediaUrl} controls />
                ) : (
                  <img src={mediaUrl} alt="Preview" />
                )
              ) : (
                <div>
                  <b>No media selected</b>
                  <span>Upload file to preview here.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
