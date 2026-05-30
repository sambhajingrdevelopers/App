import { Suspense } from 'react'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function ProfileLoading() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#080912',
        color: 'white',
      }}
    >
      Loading profile...
    </main>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClient />
    </Suspense>
  )
}
