'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

export default function SessionCheckPage() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then(setSession)
      .catch(() => setSession({ success: false }))
  }, [])

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="Session Check" subtitle="Current logged-in user.">
        <section className="createPanel">
          <h3>Current Session</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(session, null, 2)}
          </pre>
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
