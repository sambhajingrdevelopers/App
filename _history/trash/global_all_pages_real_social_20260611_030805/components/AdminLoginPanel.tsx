'use client';

import { useState } from 'react';

export default function AdminLoginPanel() {
  const [email, setEmail] = useState('admin@vibeloop.com');
  const [password, setPassword] = useState('admin123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loginAdmin() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Admin login failed');
      }

      setMessage('Admin access granted. Opening dashboard...');

      setTimeout(() => {
        window.location.href = '/admin';
      }, 700);
    } catch (error: any) {
      setMessage(error?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adminLoginScene">
      <div className="adminLoginGlow one" />
      <div className="adminLoginGlow two" />

      <section className="adminLoginCard">
        <div className="adminLoginVisual">
          <div className="adminShield">▣</div>
          <span>VibeLoop Admin Security</span>
          <h1>Control Center Access</h1>
          <p>
            Secure admin login for platform users, posts, reports, verification,
            ads and analytics management.
          </p>

          <div className="adminSecurityList">
            <div>✓ Protected dashboard</div>
            <div>✓ Session cookie security</div>
            <div>✓ Live control panel</div>
          </div>
        </div>

        <div className="adminLoginForm">
          <h2>Admin Login</h2>
          <p>Enter admin credentials to continue.</p>

          <label>
            Admin Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Admin Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button type="button" onClick={loginAdmin} disabled={loading}>
            {loading ? 'Checking...' : 'Open Admin Dashboard'}
          </button>

          {message && <div className="adminLoginMessage">{message}</div>}

          <a href="/login">Back to user login</a>
        </div>
      </section>
    </main>
  );
}
