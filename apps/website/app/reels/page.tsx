'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type ReelItem = {
  id: string
  title?: string
  caption?: string
  username?: string
  user?: string
  name?: string
  avatarUrl?: string
  mediaUrl?: string
  videoUrl?: string
  likes?: number | string
  comments?: number | string
  views?: number | string
  createdAt?: string
}

function cleanUsername(value?: string) {
  const clean = String(value || '').trim()
  if (!clean) return '@creator'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').replace('@', '').trim().slice(0, 1).toUpperCase()
}

function validMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

function timeLabel(value?: string) {
  if (!value) return 'now'
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return 'now'

  const diff = Date.now() - time
  const min = Math.max(1, Math.floor(diff / 60000))
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export default function ReelsPage() {
  const [me, setMe] = useState('@you')
  const [reels, setReels] = useState<ReelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')

  async function loadReels() {
    setLoading(true)
    setNotice('')

    try {
      const data = await fetch('/api/content/reels', {
        cache: 'no-store'
      }).then((res) => res.json())

      setReels(Array.isArray(data.reels) ? data.reels : [])

      if (!data.success) {
        setNotice(data.message || 'Reels backend failed.')
      }
    } catch {
      setReels([])
      setNotice('Backend reels connection failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function boot() {
      const session = await getSessionUser()
      setMe(cleanUsername(session.username))
      await loadReels()
    }

    boot()
  }, [])

  const filteredReels = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return reels

    return reels.filter((reel) => {
      return (
        String(reel.title || '').toLowerCase().includes(q) ||
        String(reel.caption || '').toLowerCase().includes(q) ||
        String(reel.username || '').toLowerCase().includes(q) ||
        String(reel.name || '').toLowerCase().includes(q)
      )
    })
  }, [reels, query])

  async function saveReel(reel: ReelItem) {
    const data = await fetch('/api/saved/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: me, contentId: reel.id, kind: 'reel' })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Save failed.'
    }))

    setNotice(data.message || 'Updated.')
  }

  async function moveToTrash(reel: ReelItem) {
    const data = await fetch('/api/trash/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: me, contentId: reel.id })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Move to trash failed.'
    }))

    setNotice(data.message || 'Updated.')

    if (data.success) {
      setReels((old) => old.filter((item) => item.id !== reel.id))
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="reels" title="" subtitle="" hideSearch>
        <main className="vlxRealReelsPage">
          <header className="vlxRealReelsHeader">
            <div>
              <h1>Reels</h1>
              <p>Watch real backend reels from all creators.</p>
            </div>

            <button type="button" onClick={loadReels}>Refresh</button>
          </header>

          <label className="vlxRealReelsSearch">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reels, creators..."
            />
          </label>

          {notice && <section className="vlxRealReelsNotice">{notice}</section>}

          {loading ? (
            <section className="vlxRealReelsState">Loading reels...</section>
          ) : filteredReels.length === 0 ? (
            <section className="vlxRealReelsState">
              <b>No reels found</b>
              <span>Seed backend reels or create new reels.</span>
              <a href="/create">Create Reel</a>
            </section>
          ) : (
            <section className="vlxRealReelsFeed">
              {filteredReels.map((reel) => {
                const username = cleanUsername(reel.username || reel.user)
                const name = reel.name || username.replace('@', '') || 'Creator'
                const videoSrc = reel.videoUrl || reel.mediaUrl || ''
                const isOwner = username.toLowerCase() === me.toLowerCase()

                return (
                  <article className="vlxRealReelCard" key={reel.id}>
                    <div className="vlxRealReelVideoBox">
                      {validMedia(videoSrc) ? (
                        <video src={videoSrc} controls playsInline preload="metadata" poster={reel.mediaUrl || ''} />
                      ) : (
                        <div className="vlxRealReelFallback">
                          <b>▶</b>
                          <span>Video loading failed</span>
                        </div>
                      )}

                      <div className="vlxRealReelSideActions">
                        <button type="button">♡<small>{reel.likes || 0}</small></button>
                        <button type="button">💬<small>{reel.comments || 0}</small></button>
                        <button type="button">▶<small>{reel.views || 0}</small></button>
                        <button type="button" onClick={() => saveReel(reel)}>🔖<small>Save</small></button>
                      </div>
                    </div>

                    <footer className="vlxRealReelFooter">
                      <a href={`/profile?username=${encodeURIComponent(username)}`} className="vlxRealReelAvatar">
                        {validMedia(reel.avatarUrl) ? (
                          <img src={reel.avatarUrl} alt={name} />
                        ) : (
                          <b>{firstLetter(name)}</b>
                        )}
                      </a>

                      <div>
                        <a href={`/profile?username=${encodeURIComponent(username)}`}>
                          {name} <em>✓</em>
                        </a>
                        <p>{reel.caption || reel.title || 'Backend connected reel'}</p>
                        <small>{username} · {timeLabel(reel.createdAt)}</small>

                        <div className="vlxRealReelButtons">
                          <a href={`/messages?to=${encodeURIComponent(username)}`}>Message</a>
                          <a href={`/post/${encodeURIComponent(reel.id)}`}>Open</a>
                          {isOwner && (
                            <button type="button" onClick={() => moveToTrash(reel)}>
                              Trash
                            </button>
                          )}
                        </div>
                      </div>
                    </footer>
                  </article>
                )
              })}
            </section>
          )}
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
