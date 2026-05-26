'use client'

import { ReactNode } from 'react'

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
    </div>
  )
}
