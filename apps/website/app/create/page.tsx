'use client';

import { useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import { getSessionUser } from '../../lib/sessionUser'
import SocialAppShell from '../../components/SocialAppShell';

type ContentType = 'post' | 'reel' | 'story';
type MediaType = 'image' | 'video';

export default function CreatePage() {
  const [sessionUser, setSessionUser] = useState({ userId: 'USR-YOU', id: 'USR-YOU', username: '@you', name: 'Creator' })

  const [type, setType] = useState<ContentType>('post');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('VibeLoop');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const canPublish =
    Boolean(title.trim() || caption.trim()) &&
    (type === 'post' || Boolean(mediaUrl));

  async function uploadFile(file: File) {
    setUploading(true);
    setMessage('Uploading your media securely...');

    try {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        throw new Error('Please upload an image or video file.');
      }

      if (type === 'reel' && !isVideo) {
        throw new Error('Reels need a video file.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed.');
      }

      setMediaUrl(data.mediaUrl);
      setMediaType(data.mediaType === 'video' ? 'video' : 'image');
      setMessage('Media uploaded successfully. You can publish now.');
    } catch (error: any) {
      setMessage(error?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function publishContent() {
    if (!title.trim() && !caption.trim()) {
      setMessage('Add a title or caption first.');
      return;
    }

    if ((type === 'reel' || type === 'story') && !mediaUrl) {
      setMessage(type === 'reel' ? 'Upload a video for your reel first.' : 'Upload media for your story first.');
      return;
    }

    setCreating(true);
    setMessage('Publishing your content...');

    const payload = {
      title: title.trim() || (type === 'post' ? 'New Post' : type === 'reel' ? 'New Reel' : 'New Story'),
      caption: caption.trim(),
      location: location.trim() || 'VibeLoop',
      mediaUrl,
      mediaType,
      username: '{sessionUser.username}',
      name: 'Creator',
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
        throw new Error(data.message || 'Publish failed.');
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

  function selectType(nextType: ContentType) {
    setType(nextType);
    setMessage('');

    if (nextType === 'reel' && mediaType === 'image' && mediaUrl) {
      setMessage('Reels work best with video. Upload a video before publishing.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="create"
        title="Create"
        subtitle="Upload posts, reels and stories with secure media uploads."
      >
        <section className="createHero">
          <div>
            <span>Creator Studio</span>
            <h2>Create real social content</h2>
            <p>Upload media once, then publish your post, reel or story.</p>
          </div>

          <button type="button" onClick={publishContent} disabled={creating || uploading || !canPublish}>
            {creating ? 'Publishing...' : 'Publish'}
          </button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="createTabs">
          <button type="button" className={type === 'post' ? 'active' : ''} onClick={() => selectType('post')}>
            Post
          </button>
          <button type="button" className={type === 'reel' ? 'active' : ''} onClick={() => selectType('reel')}>
            Reel
          </button>
          <button type="button" className={type === 'story' ? 'active' : ''} onClick={() => selectType('story')}>
            Story
          </button>
        </section>

        <section className="createGrid">
          <div className="createPanel">
            <h3>Content Details</h3>

            <label>
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={type === 'post' ? 'Post title...' : type === 'reel' ? 'Reel title...' : 'Story title...'}
              />
            </label>

            <label>
              Caption
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Write a caption..."
              />
            </label>

            {type === 'post' && (
              <label>
                Location
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Location..."
                />
              </label>
            )}

            <label>
              Media Link
              <input
                value={mediaUrl}
                onChange={(event) => {
                  setMediaUrl(event.target.value);
                  if (event.target.value.match(/\.(mp4|mov|webm)(\?|$)/i)) {
                    setMediaType('video');
                  }
                }}
                placeholder="Upload media or paste a media link..."
              />
            </label>

            <div className="createPublishInfo">
              <b>Publishing as {sessionUser.username}</b>
              <span>
                Your new {type} will appear automatically in the live feed after publishing.
              </span>
            </div>

            <button type="button" onClick={publishContent} disabled={creating || uploading || !canPublish}>
              {creating ? 'Publishing...' : `Publish ${type}`}
            </button>
          </div>

          <div className="createPanel">
            <h3>Upload Media</h3>

            <label className="createUploader">
              <input
                type="file"
                accept={type === 'reel' ? 'video/*' : 'image/*,video/*'}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />

              <div>
                <b>{uploading ? 'Uploading...' : 'Choose File'}</b>
                <span>
                  {type === 'reel'
                    ? 'Upload a video for your reel.'
                    : 'Upload an image or video for your content.'}
                </span>
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
                  <span>Upload a file to preview it here.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
