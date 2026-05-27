'use client'

import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  active?: string
  title?: string
  subtitle?: string
  hideSearch?: boolean
}

const navItems = [
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
    <div className="vlxShell">
      <main className="vlxPage">
        {(title || subtitle) && (
          <header className="vlxPageHeader">
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </header>
        )}

        {children}
      </main>

      <nav className="vlxBottomNav">
        {navItems.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={`${active === item.key ? 'active' : ''} ${item.key === 'reels' ? 'centerReel' : ''}`}
          >
            <span>{item.icon}</span>
            <b>{item.label}</b>
          </a>
        ))}
      </nav>
    </div>
  )
}
