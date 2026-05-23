'use client';

import { useEffect, useState } from 'react';

export default function AdminLoginPage() {
  const [nextPath, setNextPath] = useState('/admin/users');
  const [email, setEmail] = useState('admin@vibeloop.app');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');

      if (next && next.startsWith('/')) {
        setNextPath(next);
      }
    } catch {
      setNextPath('/admin/users');
    }
  }, []);

  async function login() {
    setMessage('Checking admin credentials...');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      setMessage('Login successful. Opening admin panel...');
      window.location.href = nextPath;
    } catch (error: any) {
      setMessage(error?.message || 'Admin login failed.');
    }
  }

  return (
    <main className="adminLoginPage">
      <section className="adminLoginCard">
        <div className="adminLoginBadge">Secure Admin Access</div>

        <h1>VibeLoop Admin Login</h1>
        <p>Only authorized admins can access user management, moderation and backend controls.</p>

        {message && <div className="adminLoginMessage">{message}</div>}

        <label>
          Admin Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@vibeloop.app"
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Enter admin password"
            onKeyDown={(event) => {
              if (event.key === 'Enter') login();
            }}
          />
        </label>

        <button type="button" onClick={login}>Login Securely</button>
      </section>
    </main>
  );
}
