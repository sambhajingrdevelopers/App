'use client';

import { useEffect, useState } from 'react';

export default function AdminNavLink({ active = false }: { active?: boolean }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminSession() {
      try {
        const response = await fetch('/api/admin/session', {
          cache: 'no-store'
        });

        if (!response.ok) return;

        const data = await response.json();

        if (data.authenticated) {
          setIsAdmin(true);
        }
      } catch {
        setIsAdmin(false);
      }
    }

    checkAdminSession();
  }, []);

  if (!isAdmin) return null;

  return (
    <a href="/admin" className={active ? 'active' : ''}>
      ▣ Admin
    </a>
  );
}
