'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/home', label: 'Home', icon: '⌂', key: 'home' },
  { href: '/search', label: 'Search', icon: '⌕', key: 'search' },
  { href: '/create', label: 'Create', icon: '＋', key: 'create', special: true },
  { href: '/reels', label: 'Reels', icon: '▶', key: 'reels' },
  { href: '/profile', label: 'Profile', icon: '◉', key: 'profile' }
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const activeKey = useMemo(() => {
    if (pathname.startsWith('/search')) return 'search';
    if (pathname.startsWith('/create')) return 'create';
    if (pathname.startsWith('/reel') || pathname.startsWith('/reels')) return 'reels';
    if (pathname.startsWith('/profile') || pathname.startsWith('/u/')) return 'profile';
    return 'home';
  }, [pathname]);

  async function loadBadges() {
    try {
      const [notificationResponse, messageResponse] = await Promise.all([
        fetch('/api/notification-summary', { cache: 'no-store' }),
        fetch('/api/messages/threads', { cache: 'no-store' })
      ]);

      const notificationData = await notificationResponse.json();
      const messageData = await messageResponse.json();

      setNotificationCount(notificationData.summary?.unread || 0);
      setMessageCount(messageData.unreadTotal || 0);
    } catch {
      setNotificationCount(0);
      setMessageCount(0);
    }
  }

  useEffect(() => {
    loadBadges();

    const timer = setInterval(loadBadges, 20000);
    return () => clearInterval(timer);
  }, []);

  const hidden =
    pathname.startsWith('/admin-login') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register');

  if (hidden) return null;

  return (
    <>
      <nav className="mobileBottomNav">
        {navItems.map((item) => (
          <a
            href={item.href}
            className={`${activeKey === item.key ? 'active' : ''} ${item.special ? 'special' : ''}`}
            key={item.key}
            aria-label={item.label}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </a>
        ))}
      </nav>

      <div className="mobileQuickStack">
        <a href="/notifications" aria-label="Notifications">
          🔔
          {notificationCount > 0 && <em>{notificationCount > 99 ? '99+' : notificationCount}</em>}
        </a>

        <a href="/messages" aria-label="Messages">
          ✉
          {messageCount > 0 && <em>{messageCount > 99 ? '99+' : messageCount}</em>}
        </a>
      </div>
    </>
  );
}
