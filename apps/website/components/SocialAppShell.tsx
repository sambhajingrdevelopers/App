'use client';

import type { ReactNode } from 'react';

type Props = {
  active: 'home' | 'explore' | 'reels' | 'messages' | 'notifications' | 'profile';
  title: string;
  subtitle: string;
  children: ReactNode;
};

const menu = [
  { key: 'home', label: '⌂ Home', href: '/home' },
  { key: 'explore', label: '⌕ Explore', href: '/explore' },
  { key: 'reels', label: '▶ Reels', href: '/reels' },
  { key: 'messages', label: '✉ Messages', href: '/messages' },
  { key: 'notifications', label: '♡ Notifications', href: '/notifications' },
  { key: 'profile', label: '◉ Profile', href: '/profile' }
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
          <a>⚙ Settings</a>
        </nav>

        <button
          className="vlLogout"
          type="button"
          onClick={() => {
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
          <h3>VibeLoop Creator</h3>
          <p>@you</p>

          <div className="vlMiniStats">
            <div>
              <b>248</b>
              <span>Posts</span>
            </div>
            <div>
              <b>52.8K</b>
              <span>Followers</span>
            </div>
          </div>
        </div>

        <div className="vlPanel">
          <h3>Trending Reels</h3>
          {['Fashion Drop', 'Office Story', 'Creator Life'].map((item, index) => (
            <div className="vlTrend" key={item}>
              <div>▶</div>
              <span>{item}</span>
              <b>{index + 1}.{index + 2}M</b>
            </div>
          ))}
        </div>

        <div className="vlPanel">
          <h3>Suggested Creators</h3>
          {['Mira Creates', 'Travel Dev', 'Urban Snap'].map((name) => (
            <div className="vlCreator" key={name}>
              <div>{name[0]}</div>
              <span>{name}</span>
              <button type="button">Follow</button>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
