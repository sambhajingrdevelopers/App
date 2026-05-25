'use client';

import { useEffect, useState, type ReactNode } from 'react';
import AdminNavLink from './AdminNavLink';

type ActivePage = string;

type Props = {
  hideSearch?: boolean
  active: ActivePage;
  title: string;
  subtitle: string;
  children: ReactNode;
};

const menu: { key: ActivePage; label: string; href: string }[] = [
  { key: 'home', label: '⌂ Home', href: '/home' },
  { key: 'explore', label: '⌕ Explore', href: '/explore' },
  { key: 'stories', label: '◎ Stories', href: '/stories' },
  { key: 'reels', label: '▶ Reels', href: '/reels' },
  { key: 'messages', label: '✉ Messages', href: '/messages' },
  { key: 'notifications', label: '♡ Notifications', href: '/notifications' },
  { key: 'saved', label: '🔖 Saved', href: '/saved' },
  { key: 'following', label: '👥 Following', href: '/following' },
  { key: 'trash', label: '🗑 Trash', href: '/trash' },
  { key: 'profile', label: '◉ Profile', href: '/profile' },
  { key: 'settings', label: '⚙ Settings', href: '/settings' },
  { key: 'analytics', label: '📊 Analytics', href: '/analytics' },
  { key: 'safety', label: '🛡 Safety', href: '/safety' },
  { key: 'verification', label: '✓ Verification', href: '/verification' },
  { key: 'ads', label: '📣 Ads', href: '/ads' },
  { key: 'wallet', label: '💰 Wallet', href: '/wallet' },
  { key: 'create', label: '＋ Create', href: '/create' }
];

export default function SocialAppShell({ active, title, subtitle, children, hideSearch = false }: Props) {
  const [topSearch, setTopSearch] = useState('');
  const [profile, setProfile] = useState({
    displayName: 'VibeLoop Creator',
    username: '@you',
    bio: 'Digital creator • Reels • Stories • Brand collaborations'
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vibeloop_profile');
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {
      // keep default profile
    }
  }, []);

  const initial = profile.displayName?.[0]?.toUpperCase() || 'V';

  return (
    <main className="vlApp">
      <aside className="vlSidebar">
        <div className="vlBrand">
          <div>V</div>
          <span>VibeLoop</span>
        </div>

        <nav className="vlMenu">
          {menu.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={active === item.key ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}

          <AdminNavLink active={active === 'admin'} />
          {active === 'admin' && <a href="/admin/qa">✅ QA</a>}
          {active === 'admin' && <a href="/admin/media">🖼 Media</a>}
          {active === 'admin' && <a href="/admin/audit">🛡 Audit</a>}
          {active === 'admin' && <a href="/admin/users">👥 Users</a>}
          {active === 'admin' && <a href="/admin/moderation">🧾 Moderation</a>}
        </nav>

        <button
          className="vlLogout"
          type="button"
          onClick={async () => {
            if (active === 'admin') {
              await fetch('/api/admin/logout', { method: 'POST' });
              window.location.href = '/admin-login';
              return;
            }

            localStorage.removeItem('vibeloop_user');
        fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
            window.location.href = '/login';
          }}
        >
          Logout
        </button>
      </aside>

      <section className="vlMain">
        <header className="vlTopbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {!hideSearch && (<div className="vlSearch">
            <span>⌕</span>
            <input
              placeholder="Search creators, reels, hashtags..."
              value={topSearch}
              onChange={(event) => setTopSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && topSearch.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(topSearch)}`;
                }
              }}
            />
          </div>)}
        </header>

        {children}
      </section>

      <aside className="vlRightbar">
        <div className="vlProfileMini">
          <div className="vlProfileAvatar">{active === 'admin' ? 'A' : initial}</div>
          <h3>{active === 'admin' ? 'Admin Control' : profile.displayName}</h3>
          <p>{active === 'admin' ? '@vibeloop_admin' : profile.username}</p>

          <div className="vlMiniStats">
            <div>
              <b>{active === 'admin' ? 'Live' : '248'}</b>
              <span>{active === 'admin' ? 'Status' : 'Posts'}</span>
            </div>
            <div>
              <b>{active === 'admin' ? '99%' : '52.8K'}</b>
              <span>{active === 'admin' ? 'Health' : 'Followers'}</span>
            </div>
          </div>
        </div>

        <div className="vlPanel">
          <h3>{active === 'admin' ? 'System Modules' : 'Trending Reels'}</h3>
          {(active === 'admin'
            ? ['User Control', 'Post Review', 'Reports', 'Ads Manager']
            : ['Fashion Drop', 'Office Story', 'Creator Life']
          ).map((item, index) => (
            <div className="vlTrend" key={item}>
              <div>{active === 'admin' ? '▣' : '▶'}</div>
              <span>{item}</span>
              <b>{index + 1}</b>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
