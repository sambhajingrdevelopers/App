'use client';

import type { ReactNode } from 'react';

type ActivePage =
  | 'home'
  | 'explore'
  | 'reels'
  | 'messages'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'admin';

type Props = {
  active: ActivePage;
  title: string;
  subtitle: string;
  children: ReactNode;
};

const menu: { key: ActivePage; label: string; href: string }[] = [
  { key: 'home', label: '⌂ Home', href: '/home' },
  { key: 'explore', label: '⌕ Explore', href: '/explore' },
  { key: 'reels', label: '▶ Reels', href: '/reels' },
  { key: 'messages', label: '✉ Messages', href: '/messages' },
  { key: 'notifications', label: '♡ Notifications', href: '/notifications' },
  { key: 'profile', label: '◉ Profile', href: '/profile' },
  { key: 'settings', label: '⚙ Settings', href: '/settings' },
  { key: 'admin', label: '▣ Admin', href: '/admin' }
];

export default function SocialAppShell({ active, title, subtitle, children }: Props) {
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

          <div className="vlSearch">
            <span>⌕</span>
            <input placeholder="Search creators, reels, hashtags..." />
          </div>
        </header>

        {children}
      </section>

      <aside className="vlRightbar">
        <div className="vlProfileMini">
          <div className="vlProfileAvatar">V</div>
          <h3>Admin Control</h3>
          <p>@vibeloop_admin</p>

          <div className="vlMiniStats">
            <div>
              <b>Live</b>
              <span>Status</span>
            </div>
            <div>
              <b>99%</b>
              <span>Health</span>
            </div>
          </div>
        </div>

        <div className="vlPanel">
          <h3>System Modules</h3>
          {['User Control', 'Post Review', 'Reports', 'Ads Manager'].map((item, index) => (
            <div className="vlTrend" key={item}>
              <div>▣</div>
              <span>{item}</span>
              <b>{index + 1}</b>
            </div>
          ))}
        </div>

        <div className="vlPanel">
          <h3>Quick Actions</h3>
          {['Verify Creator', 'Review Report', 'Create Ad'].map((name) => (
            <div className="vlCreator" key={name}>
              <div>{name[0]}</div>
              <span>{name}</span>
              <button type="button">Open</button>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
