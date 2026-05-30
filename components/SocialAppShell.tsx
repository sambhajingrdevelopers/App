'use client'

import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  active?: string
  hideSearch?: boolean
}

export default function SocialAppShell({ children }: Props) {
  return <>{children}</>
}
