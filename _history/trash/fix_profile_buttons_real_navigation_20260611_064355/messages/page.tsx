import { Suspense } from 'react'
import MessagesClient from './MessagesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MessagesPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100dvh', background: '#0b141a', color: 'white', display: 'grid', placeItems: 'center' }}>Loading chats...</main>}>
      <MessagesClient />
    </Suspense>
  )
}
