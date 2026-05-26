'use client'

import { ReactNode, useState } from 'react'

type Props = {
  children: ReactNode
  active?: string
  title?: string
  subtitle?: string
  hideSearch?: boolean
}

const bottomNav = [
  { key: 'home', label: 'Home', href: '/home', icon: '⌂' },
  { key: 'creators', label: 'Creators', href: '/search', icon: '👥' },
  { key: 'reels', label: 'Reels', href: '/reels', icon: '▣' },
  { key: 'saved', label: 'Saved', href: '/saved', icon: '♡' },
  { key: 'profile', label: 'Profile', href: '/profile', icon: '◉' }
]

export default function SocialAppShell({
  children,
  active = 'home',
  title = '',
  subtitle = ''
}: Props) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="neoShell">
      <main className="neoPage">
        {(title || subtitle) && (
          <header className="neoPageHeader">
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </header>
        )}

        {children}
      </main>

      <div className="neoSideActions neoOnlyFloatingActions">
        <button
          className="neoSideCreate"
          type="button"
          onClick={() => setCreateOpen(true)}
          aria-label="Create"
        >
          +
        </button>

        <a href="/notifications" aria-label="Notifications">
          🔔
          <i>1</i>
        </a>

        <a href="/messages" aria-label="Messages">
          ✉
          <i>1</i>
        </a>
      </div>

      <nav className="neoBottomNav">
        {bottomNav.map((item) => (
          <a
            href={item.href}
            key={item.key}
            className={`${active === item.key ? 'active' : ''} ${item.key === 'reels' ? 'reelsCenter' : ''}`}
          >
            <span>{item.icon}</span>
            <b>{item.label}</b>
          </a>
        ))}
      </nav>

      {createOpen && (
        <div className="neoSheetBackdrop" onClick={() => setCreateOpen(false)}>
          <section className="neoCreateSheet" onClick={(e) => e.stopPropagation()}>
            <div className="neoSheetHandle" />
            <h2>Create</h2>
            <p>Choose what you want to upload.</p>

            <div className="neoCreateOptions">
              <a href="/create?type=post"><span>▧</span><b>Post</b></a>
              <a href="/create?type=reel"><span>▣</span><b>Reel</b></a>
              <a href="/create?type=story"><span>◉</span><b>Story</b></a>
              <a href="/create?type=live"><span>◎</span><b>Go Live</b></a>
            </div>

            <button type="button" onClick={() => setCreateOpen(false)}>
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
