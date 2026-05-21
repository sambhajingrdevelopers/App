'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    displayName: 'VibeLoop Creator',
    username: '@you',
    bio: 'Digital creator • Reels • Stories • Brand collaborations',
    avatarUrl: '',
    bannerUrl: ''
  });

  const [postsCount, setPostsCount] = useState(248);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        const result = await response.json();

        if (result.profile) {
          setProfile((current) => ({
            ...current,
            ...result.profile
          }));

          localStorage.setItem('vibeloop_profile', JSON.stringify(result.profile));
        }
      } catch {
        try {
          const savedProfile = localStorage.getItem('vibeloop_profile');

          if (savedProfile) {
            setProfile((current) => ({
              ...current,
              ...JSON.parse(savedProfile)
            }));
          }
        } catch {
          // keep default profile
        }
      }

      try {
        const savedPosts = localStorage.getItem('vibeloop_posts');

        if (savedPosts) {
          setPostsCount(JSON.parse(savedPosts).length);
        }
      } catch {
        // keep default count
      }
    }

    loadProfile();
  }, []);

  const initial = profile.displayName?.[0]?.toUpperCase() || 'V';

  return (
    <AuthGuard>
      <SocialAppShell
        active="profile"
        title="Profile"
        subtitle="Manage your creator identity and social presence."
      >
        <div className="vlProfilePage">
          <div
            className="vlProfileBanner"
            style={{
              backgroundImage: profile.bannerUrl ? `url(${profile.bannerUrl})` : undefined
            }}
          />

          <div className="vlProfileInfo">
            <div
              className="vlProfileAvatar big"
              style={{
                backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined
              }}
            >
              {!profile.avatarUrl && initial}
            </div>

            <div>
              <h2>{profile.displayName}</h2>
              <p>{profile.username} • {profile.bio}</p>
            </div>

            <a className="vlEditProfileLink" href="/settings">
              Edit Profile
            </a>
          </div>

          <div className="vlProfileStatsRow">
            <div>
              <b>{postsCount}</b>
              <span>Posts</span>
            </div>
            <div>
              <b>52.8K</b>
              <span>Followers</span>
            </div>
            <div>
              <b>320</b>
              <span>Following</span>
            </div>
            <div>
              <b>1.2M</b>
              <span>Views</span>
            </div>
          </div>

          <div className="vlProfileMediaGrid">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} />
            ))}
          </div>
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
