'use client';

import { useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('VibeLoop Creator');
  const [username, setUsername] = useState('@you');
  const [bio, setBio] = useState('Digital creator • Reels • Stories • Brand collaborations');
  const [message, setMessage] = useState('');

  function saveSettings() {
    localStorage.setItem(
      'vibeloop_profile',
      JSON.stringify({
        displayName,
        username,
        bio
      })
    );

    setMessage('Settings saved successfully.');
  }

  function clearLocalPosts() {
    localStorage.removeItem('vibeloop_posts');
    setMessage('Local saved posts cleared.');
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="settings"
        title="Settings"
        subtitle="Manage your profile, privacy, security and account preferences."
      >
        <div className="vlSettingsGrid">
          <section className="vlSettingsCard">
            <h2>Profile Settings</h2>
            <p>Update your creator identity and public profile details.</p>

            <label>
              Display Name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label>
              Bio
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </label>

            <button type="button" onClick={saveSettings}>
              Save Profile
            </button>
          </section>

          <section className="vlSettingsCard">
            <h2>Privacy</h2>
            <p>Control who can view and interact with your content.</p>

            <div className="vlToggleRow">
              <div>
                <b>Private Account</b>
                <span>Only approved followers can view your posts.</span>
              </div>
              <input type="checkbox" />
            </div>

            <div className="vlToggleRow">
              <div>
                <b>Show Online Status</b>
                <span>Allow others to see when you are online.</span>
              </div>
              <input type="checkbox" defaultChecked />
            </div>

            <div className="vlToggleRow">
              <div>
                <b>Allow Message Requests</b>
                <span>Receive messages from new creators.</span>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
          </section>

          <section className="vlSettingsCard">
            <h2>Security</h2>
            <p>Protect your account and login sessions.</p>

            <div className="vlSecurityItem">
              <b>Password</b>
              <span>Last changed recently</span>
              <button type="button">Change</button>
            </div>

            <div className="vlSecurityItem">
              <b>Two-Step Verification</b>
              <span>Add extra protection to your account.</span>
              <button type="button">Enable</button>
            </div>

            <div className="vlSecurityItem">
              <b>Active Sessions</b>
              <span>Manage devices where you are logged in.</span>
              <button type="button">View</button>
            </div>
          </section>

          <section className="vlSettingsCard">
            <h2>App Preferences</h2>
            <p>Control theme, storage and local app behavior.</p>

            <div className="vlThemePreview">
              <div />
              <div />
              <div />
            </div>

            <button type="button" onClick={clearLocalPosts}>
              Clear Local Saved Posts
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('vibeloop_user');
                window.location.href = '/login';
              }}
            >
              Logout Account
            </button>
          </section>
        </div>

        {message && <div className="vlSettingsMessage">{message}</div>}
      </SocialAppShell>
    </AuthGuard>
  );
}
