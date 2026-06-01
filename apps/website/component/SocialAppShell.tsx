'use client'

import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  active?: string
  hideSearch?: boolean
  title?: string
  subtitle?: string
  className?: string
}

export default function SocialAppShell({
  children,
  title,
  subtitle,
  className = '',
}: Props) {
  return (
    <main className={className}>
      {(title || subtitle) && (
        <section className="socialShellHeader">
          {title && <h1>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </section>
      )}
      {children}
    </main>
  )
}
