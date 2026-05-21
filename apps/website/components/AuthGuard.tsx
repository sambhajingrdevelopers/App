'use client';

import { useEffect, useState } from 'react';

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
