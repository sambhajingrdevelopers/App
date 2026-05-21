'use client';

import { useEffect, useState } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/admin/session', {
          cache: 'no-store'
        });

        if (!response.ok) {
          window.location.href = '/admin-login';
          return;
        }

        const data = await response.json();

        if (!data.authenticated) {
          window.location.href = '/admin-login';
          return;
        }

        setReady(true);
      } catch {
        window.location.href = '/admin-login';
      }
    }

    checkAdmin();
  }, []);

  if (!ready) {
    return (
      <div className="authChecking">
        <div className="authCheckingCard">
          <div className="authLoader" />
          <h2>Checking Admin Access</h2>
          <p>Verifying secure dashboard session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
