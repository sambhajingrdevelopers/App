'use client'

import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

export default function SavedPage() {
  return (
    <AuthGuard>
      <SocialAppShell active="saved" title="" subtitle="" hideSearch>
        <main className="neoSimplePage">
          <h1>Saved</h1>
          <p>Your saved posts, reels and creators will appear here.</p>

          <section>
            <b>No saved content yet</b>
            <span>Tap the save icon on posts or reels.</span>
          </section>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
