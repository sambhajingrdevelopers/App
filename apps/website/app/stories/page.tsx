'use client';

import { useEffect, useRef, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type Story = {
  id: string;
  name: string;
  username: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  views: number;
};

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadStories() {
    try {
      const response = await fetch('/api/stories', { cache: 'no-store' });
      const data = await response.json();

      setStories(data.stories || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadStories();
  }, []);

  async function uploadStoryMedia(file: File) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setMessage('Only image or video story allowed.');
      return;
    }

    setUploading(true);
    setMessage('Uploading story media...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.message || 'Upload failed');
      }

      setMediaUrl(result.mediaUrl);
      setMediaType(result.mediaType || (isVideo ? 'video' : 'image'));
      setMessage('Story media uploaded.');
    } catch {
      const reader = new FileReader();

      reader.onload = () => {
        setMediaUrl(String(reader.result));
        setMediaType(isVideo ? 'video' : 'image');
        setMessage('Server upload failed. Local preview ready.');
      };

      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }

  async function publishStory() {
    if (!mediaUrl) {
      setMessage('Please upload image/video first.');
      return;
    }

    let profile = {
      displayName: 'You',
      username: '@you'
    };

    try {
      const savedProfile = localStorage.getItem('vibeloop_profile');
      if (savedProfile) profile = { ...profile, ...JSON.parse(savedProfile) };
    } catch {
      // keep default
    }

    const story = {
      id: `LOCAL-${Date.now()}`,
      name: profile.displayName || 'You',
      username: profile.username || '@you',
      mediaUrl,
      mediaType,
      caption,
      views: 0
    };

    setStories([story, ...stories]);
    setCaption('');
    setMediaUrl('');
    setMessage('Publishing story...');

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Story publish failed');
      }

      setMessage('Story saved to backend.');
      loadStories();
    } catch {
      setMessage('Backend failed. Story added locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="stories"
        title="Stories"
        subtitle="Upload, view and manage creator stories."
      >
        <div className="vlMessagesStatus">
          <span>{source === 'backend' ? 'Live Backend Stories' : 'Fallback Stories Ready'}</span>
          {message && <b>{message}</b>}
        </div>

        <section className="vlStoryComposer">
          <div>
            <h2>Create Story</h2>
            <p>Upload an image or short video story for your audience.</p>
          </div>

          <textarea
            placeholder="Write story caption..."
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />

          {mediaUrl && (
            <div className="vlStoryPreview">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls />
              ) : (
                <img src={mediaUrl} alt="Story preview" />
              )}
            </div>
          )}

          <div className="vlComposerActions">
            <button
              className="vlMediaBtn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Story Media'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadStoryMedia(file);
              }}
            />

            <button className="vlPostBtn" type="button" onClick={publishStory}>
              Publish Story
            </button>
          </div>
        </section>

        <section className="vlStoriesGrid">
          {stories.map((story) => (
            <article className="vlStoryCard" key={story.id}>
              <div className="vlStoryMedia">
                {story.mediaUrl ? (
                  story.mediaType === 'video' ? (
                    <video src={story.mediaUrl} controls />
                  ) : (
                    <img src={story.mediaUrl} alt={story.caption || story.name} />
                  )
                ) : (
                  <div className="vlStoryFallback">{story.name[0]}</div>
                )}
              </div>

              <div className="vlStoryCardInfo">
                <b>{story.name}</b>
                <span>{story.username}</span>
                <p>{story.caption}</p>
                <small>{story.views} views</small>
              </div>
            </article>
          ))}
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
