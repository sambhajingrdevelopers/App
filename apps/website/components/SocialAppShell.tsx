'use client'

import type { ReactNode } from 'react'

type SocialAppShellProps = {
  children: ReactNode
  active?: string
  title?: string
  subtitle?: string
  hideSearch?: boolean
}

const navItems = [
  { key: 'home', label: 'Home', href: '/home', icon: '⌂' },
  { key: 'search', label: 'Search', href: '/search', icon: '⌕' },
  { key: 'create', label: 'Create', href: '/create', icon: '+' },
  { key: 'reels', label: 'Reels', href: '/reels', icon: '▶' },
  { key: 'profile', label: 'Profile', href: '/profile', icon: '◉' }
]

const railItems = [
  { key: 'home', href: '/home', icon: '⌂' },
  { key: 'search', href: '/search', icon: '⌕' },
  { key: 'create', href: '/create', icon: '+' },
  { key: 'reels', href: '/reels', icon: '▶' },
  { key: 'messages', href: '/messages', icon: '✉' },
  { key: 'notifications', href: '/notifications', icon: '🔔' },
  { key: 'profile', href: '/profile', icon: '◉' }
]

export default function SocialAppShell({
  children,
  active = 'home',
  title = '',
  subtitle = '',
  hideSearch = false
}: SocialAppShellProps) {
  return (
    <div className="vlFixedShell">
      <aside className="vlFixedRail">
        <a className="vlRailLogo" href="/profile">V</a>

        <nav>
          {railItems.map((item) => (
            <a
              href={item.href}
              key={item.key}
              className={active === item.key ? 'active' : ''}
              aria-label={item.key}
            >
              {item.icon}
            </a>
          ))}
        </nav>

        <a className="vlRailLogout" href="/login">Logout</a>
      </aside>

      <section className="vlFixedPage">
        {(title || subtitle || !hideSearch) && (
          <header className="vlFixedHeader">
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}

            {!hideSearch && (
              <a className="vlFixedSearch" href="/search">
                <span>⌕</span>
                <b>Search creators, reels, hashtags...</b>
              </a>
            )}
          </header>
        )}

        {children}
      </section>

      <div className="vlFloatingActions">
        <a href="/notifications">🔔</a>
        <a href="/messages">
          ✉
          <i>1</i>
        </a>
      </div>

      <nav className="vlBottomNav">
        {navItems.map((item) => (
          <a
            href={item.href}
            key={item.key}
            className={active === item.key ? 'active' : ''}
          >
            <span>{item.icon}</span>
            <b>{item.label}</b>
          </a>
        ))}
      </nav>
    </div>
  )
}
