'use client';

import { useEffect, useState } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking');
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store'
        });

        const data = await response.json();

        if (!response.ok || !data.success || data.user?.role !== 'admin') {
          setStatus('blocked');
          setTimeout(() => {
            window.location.href = `/admin-login?next=${encodeURIComponent(window.location.pathname)}`;
          }, 700);
          return;
        }

        setAdmin(data.user);
        setStatus('allowed');
      } catch {
        setStatus('blocked');
        setTimeout(() => {
          window.location.href = `/admin-login?next=${encodeURIComponent(window.location.pathname)}`;
        }, 700);
      }
    }

    checkAdmin();
  }, []);

  if (status === 'checking') {
    return (
      <div className="adminGuardState">
        <div />
        <h2>Checking admin session...</h2>
        <p>Please wait while secure admin access is verified.</p>
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <div className="adminGuardState blocked">
        <div />
        <h2>Admin login required</h2>
        <p>Redirecting to secure admin login.</p>
      </div>
    );
  }

  return (
    <>
      <div className="adminSessionStrip">
        <span>Secure admin session</span>
        <b>{admin?.email || 'Admin'}</b>
      </div>
      {children}
    </>
  );
}
