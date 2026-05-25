'use client';

import { useEffect, useState } from 'react';

async function syncVibeLoopSession() {
  try {
    const raw =
      localStorage.getItem('vibeloop_user') ||
      localStorage.getItem('user') ||
      localStorage.getItem('auth_user')

    if (!raw) return

    const user = JSON.parse(raw)

    const username =
      user.username ||
      user.user ||
      user.email ||
      user.phone ||
      '@you'

    const payload = {
      userId: user.userId || user.id || user._id || '',
      username,
      name: user.name || user.fullName || username
    }

    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch {
    // session sync fail should not block page
  }
}



export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('vibeloop_user');

    if (!user) {
      window.location.href = '/login';
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="authChecking">
        <div className="authCheckingCard">
          <div className="authLoader" />
          <h2>Opening VibeLoop</h2>
          <p>Checking secure creator access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}