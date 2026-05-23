'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function EditProfilePage() {
  const [oldUsername, setOldUsername] = useState('@you');
  const [name, setName] = useState('VibeLoop Creator');
  const [username, setUsername] = useState('@you');
  const [bio, setBio] = useState('Digital creator • Reels • Stories');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/me', { cache: 'no-store' });
        const data = await response.json();

        if (data.success && data.user) {
          setOldUsername(data.user.username || '@you');
          setName(data.user.name || 'VibeLoop Creator');
          setUsername(data.user.username || '@you');
          setBio(data.user.bio || 'Digital creator • Reels • Stories');
          setAvatarUrl(data.user.avatarUrl || '');
          setBannerUrl(data.user.bannerUrl || '');
        }
      } catch {
        setMessage('Profile loaded with default values.');
      }
    }

    loadProfile();
  }, []);

  async function uploadProfileImage(file: File, target: 'avatar' | 'banner') {
    setUploadingImage(true);
    setMessage(target === 'avatar' ? 'Uploading avatar...' : 'Uploading banner...');

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed.');
      }

      if (target === 'avatar') {
        setAvatarUrl(data.mediaUrl);
      } else {
        setBannerUrl(data.mediaUrl);
      }

      setMessage('Image uploaded successfully. Save profile to apply changes.');
    } catch (error: any) {
      setMessage(error?.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setMessage('Saving profile...');

    try {
      const cleanUsername = username.trim().startsWith('@')
        ? username.trim()
        : `@${username.trim()}`;

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldUsername,
          name: name.trim(),
          username: cleanUsername,
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          bannerUrl: bannerUrl.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Profile update failed.');
      }

      setMessage('Profile saved successfully.');
      window.location.href = '/profile';
    } catch (error: any) {
      setMessage(error?.message || 'Profile save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="profile"
        title="Edit Profile"
        subtitle="Update your creator profile details."
      >
        <section className="createHero">
          <div>
            <span>Creator Profile</span>
            <h2>Edit your profile</h2>
            <p>Update your name, username, bio and profile visuals.</p>
          </div>

          <button type="button" onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="createGrid">
          <div className="createPanel">
            <h3>Basic Details</h3>

            <label>
              Display Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Display name"
              />
            </label>

            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="@username"
              />
            </label>

            <label>
              Bio
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Write your bio..."
              />
            </label>

            <button type="button" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </div>

          <div className="createPanel">
            <h3>Profile Visuals</h3>

            <label className="createUploader">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadProfileImage(file, 'avatar');
                }}
              />

              <div>
                <b>{uploadingImage ? 'Uploading...' : 'Upload Avatar'}</b>
                <span>Choose a profile photo from your device.</span>
              </div>
            </label>

            <label className="createUploader">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadProfileImage(file, 'banner');
                }}
              />

              <div>
                <b>{uploadingImage ? 'Uploading...' : 'Upload Banner'}</b>
                <span>Choose a cover/banner image from your device.</span>
              </div>
            </label>

            <label>
              Avatar Image URL
              <input
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="Avatar image URL"
              />
            </label>

            <label>
              Banner Image URL
              <input
                value={bannerUrl}
                onChange={(event) => setBannerUrl(event.target.value)}
                placeholder="Banner image URL"
              />
            </label>

            <div className="createPreview">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner preview" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar preview" />
              ) : (
                <div>
                  <b>No image selected</b>
                  <span>Upload avatar or banner to preview it here.</span>
                </div>
              )}
            </div>
          </div>
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
