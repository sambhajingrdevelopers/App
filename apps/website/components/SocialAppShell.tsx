'use client'

import { ReactNode, useState } from 'react'

type Props = {
  children: ReactNode
  active?: string
  title?: string
  subtitle?: string
  hideSearch?: boolean
}

function navActive(active: string | undefined, key: string) {
  if (!active) return false
  if (key === 'creators' && active === 'search') return true
  return active === key
}

export default function SocialAppShell({
  children,
  active = 'home',
  title = '',
  subtitle = '',
}: Props) {
  const [quickSearch, setQuickSearch] = useState(false)

  return (
    <div className="vlxShellRoot">
      <header className="vlxShellTop">
        <a href="/home" className="vlxShellLogo">
          <span>Vibe</span>
          <b>Loop</b>
        </a>

        <div className="vlxShellTopActions">
          <a href="/create" aria-label="Create">+</a>

          <button
            type="button"
            aria-label="Open search"
            onClick={() => setQuickSearch((old) => !old)}
          >
            ⚡⌕
          </button>

          <a href="/notifications" aria-label="Notifications">
            🔔
            <i>1</i>
          </a>
        </div>
      </header>

      {quickSearch && (
        <section className="vlxShellSearchPanel">
          <form action="/search">
            <span>⌕</span>
            <input name="q" autoFocus placeholder="Search creators, posts, reels..." />
            <button type="submit">Search</button>
          </form>
        </section>
      )}

      {(title || subtitle) && (
        <section className="vlxShellPageTitle">
          {title && <h1>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </section>
      )}

      <main className="vlxShellMain">
        {children}
      </main>

      <nav className="vlxShellBottom" aria-label="Main navigation">
        <a href="/home" className={navActive(active, 'home') ? 'active' : ''}>
          <span>⌂</span>
          <small>Home</small>
        </a>

        <a href="/search" className={navActive(active, 'creators') ? 'active' : ''}>
          <span>👥</span>
          <small>Creators</small>
        </a>

        <a href="/reels" className={`vlxReelsCenter ${navActive(active, 'reels') ? 'active' : ''}`}>
          <span>▣</span>
          <small>Reels</small>
        </a>

        <a href="/saved" className={navActive(active, 'saved') ? 'active' : ''}>
          <span>♡</span>
          <small>Saved</small>
        </a>

        <a href="/profile" className={navActive(active, 'profile') ? 'active' : ''}>
          <span>⊙</span>
          <small>Profile</small>
        </a>
      </nav>
    </div>
  )
}
