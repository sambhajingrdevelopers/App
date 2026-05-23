'use client';

import { useEffect, useRef, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>({
    displayName: '',
    username: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: '',
    website: '',
    location: '',
    category: 'Digital Creator'
  });

  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  function updateField(key: string, value: string) {
    setProfile((current: any) => ({ ...current, [key]: value }));
  }

  async function loadProfile() {
    try {
      const response = await fetch('/api/profile-settings', { cache: 'no-store' });
      const data = await response.json();

      setProfile(data.profile);
      setSource(data.source || 'fallback');

      try {
        localStorage.setItem('vibeloop_profile', JSON.stringify(data.profile));
      } catch {
        // ignore local storage
      }
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function uploadMedia(file: File, type: 'avatarUrl' | 'bannerUrl') {
    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      setMessage('Only image upload is allowed.');
      return;
    }

    setUploading(type);
    setMessage('Uploading image...');

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

      updateField(type, data.mediaUrl);
      setMessage('Image uploaded successfully.');
    } catch {
      const reader = new FileReader();

      reader.onload = () => {
        updateField(type, String(reader.result));
        setMessage('Server upload failed. Local preview ready.');
      };

      reader.readAsDataURL(file);
    } finally {
      setUploading('');
    }
  }

  async function saveProfile() {
    setMessage('Saving profile...');

    try {
      const response = await fetch('/api/profile-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Save failed');
      }

      setProfile(data.profile);

      try {
        localStorage.setItem('vibeloop_profile', JSON.stringify(data.profile));
      } catch {
        // ignore local storage
      }

      setMessage('Profile saved successfully. Open /profile to see changes.');
    } catch {
      setMessage('Profile save failed. Try again.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="profile"
        title="Edit Profile"
        subtitle="Update your dynamic creator profile."
      >
        <section className="editProfileHero">
          <div>
            <span>{source === 'platform' ? 'Verified Creator Profile' : 'Fallback Profile Ready'}</span>
            <h2>Edit your creator identity</h2>
            <p>Update profile photo, banner, username, bio and creator details.</p>
          </div>

          <a href="/profile">View Profile</a>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="editProfilePreview">
          <div
            className="editProfileBanner"
            style={{ backgroundImage: profile.bannerUrl ? `url(${profile.bannerUrl})` : undefined }}
          />

          <div className="editProfilePreviewInfo">
            <div
              className="editProfileAvatar"
              style={{ backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined }}
            >
              {!profile.avatarUrl && (profile.displayName?.[0] || 'V')}
            </div>

            <div>
              <h3>{profile.displayName || 'VibeLoop Creator'}</h3>
              <p>{profile.username || '@you'}</p>
              <span>{profile.bio || 'Digital creator • Reels • Stories'}</span>
            </div>
          </div>
        </section>

        <section className="editProfileGrid">
          <div className="editProfilePanel">
            <h3>Media</h3>

            <div className="editProfileUploadRow">
              <button type="button" onClick={() => avatarInputRef.current?.click()}>
                {uploading === 'avatarUrl' ? 'Uploading...' : 'Upload Avatar'}
              </button>

              <button type="button" onClick={() => bannerInputRef.current?.click()}>
                {uploading === 'bannerUrl' ? 'Uploading...' : 'Upload Banner'}
              </button>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadMedia(file, 'avatarUrl');
              }}
            />

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadMedia(file, 'bannerUrl');
              }}
            />

            <label>
              Avatar URL
              <input value={profile.avatarUrl || ''} onChange={(e) => updateField('avatarUrl', e.target.value)} />
            </label>

            <label>
              Banner URL
              <input value={profile.bannerUrl || ''} onChange={(e) => updateField('bannerUrl', e.target.value)} />
            </label>
          </div>

          <div className="editProfilePanel">
            <h3>Basic Details</h3>

            <label>
              Display Name
              <input value={profile.displayName || ''} onChange={(e) => updateField('displayName', e.target.value)} />
            </label>

            <label>
              Username
              <input value={profile.username || ''} onChange={(e) => updateField('username', e.target.value)} />
            </label>

            <label>
              Bio
              <textarea value={profile.bio || ''} onChange={(e) => updateField('bio', e.target.value)} />
            </label>

            <label>
              Category
              <select value={profile.category || 'Digital Creator'} onChange={(e) => updateField('category', e.target.value)}>
                <option>Digital Creator</option>
                <option>Business Brand</option>
                <option>Artist</option>
                <option>Education Creator</option>
                <option>Fashion Creator</option>
                <option>Tech Creator</option>
              </select>
            </label>

            <label>
              Website
              <input value={profile.website || ''} onChange={(e) => updateField('website', e.target.value)} />
            </label>

            <label>
              Location
              <input value={profile.location || ''} onChange={(e) => updateField('location', e.target.value)} />
            </label>

            <button type="button" onClick={saveProfile}>Save Profile</button>
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
