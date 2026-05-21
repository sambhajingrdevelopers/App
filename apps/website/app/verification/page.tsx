'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function VerificationPage() {
  const [username, setUsername] = useState('@you');
  const [category, setCategory] = useState('Digital Creator');
  const [requests, setRequests] = useState<any[]>([]);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadRequests() {
    try {
      const response = await fetch('/api/verification-requests', {
        cache: 'no-store'
      });

      const data = await response.json();

      setRequests(data.requests || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('vibeloop_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setUsername(profile.username || '@you');
      }
    } catch {
      // keep default
    }

    loadRequests();
  }, []);

  async function submitRequest() {
    if (!username.trim()) {
      setMessage('Username is required.');
      return;
    }

    setMessage('Submitting verification request...');

    try {
      const response = await fetch('/api/verification-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, category })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Request failed');
      }

      setRequests([data.request, ...requests]);
      setMessage('Verification request submitted successfully.');
    } catch {
      setMessage('Verification request failed. Try again.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="verification"
        title="Verification"
        subtitle="Apply for verified creator or business badge."
      >
        <section className="verificationHero">
          <div>
            <span>{source === 'backend' ? 'Live Backend Verification' : 'Fallback Verification Ready'}</span>
            <h2>Get your verified VibeLoop badge</h2>
            <p>
              Submit your creator or business verification request. Admin will review and approve it.
            </p>
          </div>

          <button type="button" onClick={loadRequests}>Refresh</button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="verificationGrid">
          <div className="verificationPanel">
            <h3>Submit Request</h3>

            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="@username"
              />
            </label>

            <label>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>Digital Creator</option>
                <option>Business Brand</option>
                <option>Public Figure</option>
                <option>Artist / Musician</option>
                <option>Education Creator</option>
                <option>News / Media</option>
              </select>
            </label>

            <button type="button" onClick={submitRequest}>
              Apply for Verification
            </button>
          </div>

          <div className="verificationPanel">
            <h3>Requirements</h3>

            <div className="verificationRequirement">
              <b>Authentic Account</b>
              <span>Your account should represent a real person, creator or brand.</span>
            </div>

            <div className="verificationRequirement">
              <b>Active Content</b>
              <span>Keep posting reels, stories and useful creator content.</span>
            </div>

            <div className="verificationRequirement">
              <b>Public Profile</b>
              <span>Your profile details should be clear and professional.</span>
            </div>
          </div>
        </section>

        <section className="verificationPanel">
          <h3>My Verification Requests</h3>

          <div className="verificationList">
            {requests.map((item) => (
              <article className="verificationItem" key={item.id}>
                <div>
                  <b>{item.username}</b>
                  <span>{item.category}</span>
                </div>

                <em className={item.status?.toLowerCase()}>{item.status}</em>
              </article>
            ))}

            {!requests.length && (
              <div className="adminEmpty">No verification requests yet.</div>
            )}
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
