'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

type FollowUser = {
  id: string
  name: string
  username: string
  avatarUrl?: string
  online?: boolean
}

export default function FollowingPage() {
  const [users, setUsers] = useState<FollowUser[]>([])
  const [username, setUsername] = useState('@creator.test')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadFollowing() {
    setLoading(true)

    try {
      const response = await fetch('/api/home/online-following', { cache: 'no-store' })
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
      }
    } catch {
      setMessage('Following list load failed')
    } finally {
      setLoading(false)
    }
  }

  async function toggleFollow(targetUsername?: string) {
    const target = (targetUsername || username).trim()

    if (!target) {
      setMessage('Enter username first')
      return
    }

    setSaving(true)
    setMessage('Updating follow status...')

    try {
      const cleanUsername = target.startsWith('@') ? target : `@${target}`

      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following: cleanUsername })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Follow action failed')
      }

      setMessage(data.message || 'Follow status updated')
      await loadFollowing()
    } catch (error: any) {
      setMessage(error?.message || 'Follow action failed')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadFollowing()
  }, [])

  return (
    <AuthGuard>
      <SocialAppShell
        active="following"
        title="Following"
        subtitle="Manage creators you follow."
      >
        <section className="createHero">
          <div>
            <span>Creator Network</span>
            <h2>Following</h2>
            <p>Follow creators to show them in your Home online row.</p>
          </div>

          <button type="button" onClick={loadFollowing} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="createPanel">
          <h3>Follow creator</h3>

          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="@creator.username"
            />
          </label>

          <button type="button" onClick={() => toggleFollow()} disabled={saving}>
            {saving ? 'Updating...' : 'Follow / Unfollow'}
          </button>
        </section>

        <section className="cleanStoryGrid">
          {users.map((user) => (
            <article className="cleanStoryCard" key={user.username}>
              <div className="onlineAvatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  <span>{(user.name || user.username || 'C').slice(0, 1).toUpperCase()}</span>
                )}
                <i />
              </div>

              <b>{user.name}</b>
              <span>{user.username} • {user.online ? 'Online' : 'Offline'}</span>

              <button
                type="button"
                className="archiveMiniButton"
                onClick={() => toggleFollow(user.username)}
                disabled={saving}
              >
                Unfollow
              </button>
            </article>
          ))}

          {!loading && users.length === 0 && (
            <div className="cleanEmptyState">
              <b>No following yet</b>
              <span>Follow a creator to see them here and on Home.</span>
            </div>
          )}
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
