'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

type ReelItem = {
  id: string
  kind?: string
  type?: string
  title?: string
  caption?: string
  username?: string
  user?: string
  name?: string
  avatarUrl?: string
  mediaUrl?: string
  videoUrl?: string
  mediaType?: string
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
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
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

function ReelVideo({ reel }: { reel: ReelItem }) {
  const src = reel.videoUrl || reel.mediaUrl || ''
  const [failed, setFailed] = useState(!validMedia(src))

  if (failed) {
    return (
      <div className="vlxReelMissing">
        <b>Video unavailable</b>
        <span>Backend media URL missing or failed.</span>
      </div>
    )
  }

  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  )
}

export default function ReelsPage() {
  const [query, setQuery] = useState('')
  const [reels, setReels] = useState<ReelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadReels() {
    setLoading(true)
    setMessage('')

    try {
      const data = await fetch('/api/reels', {
        cache: 'no-store'
      }).then((res) => res.json())

      const list = Array.isArray(data.reels) ? data.reels : []

      setReels(list)

      if (!data.success) {
        setMessage(data.message || 'Backend reels failed.')
      } else if (list.length === 0) {
        setMessage('No reels found in backend.')
      }
    } catch {
      setReels([])
      setMessage('Backend connection failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReels()
  }, [])

  const filteredReels = useMemo(() => {
    const q = query.trim().toLowerCase()

    const sorted = [...reels].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    )

    if (!q) return sorted

    return sorted.filter((reel) =>
      [
        reel.title,
        reel.caption,
        reel.username,
        reel.user,
        reel.name
      ].some((value) => String(value || '').toLowerCase().includes(q))
    )
  }, [reels, query])

  return (
    <AuthGuard>
      <SocialAppShell active="reels" title="" subtitle="" hideSearch>
        <main className="vlxReelsPage">
          <header className="vlxReelsHeader">
            <div>
              <h1>Reels</h1>
              <p>Watch video reels loaded from backend.</p>
            </div>

            <button type="button" onClick={loadReels}>
              Refresh
            </button>
          </header>

          <form className="vlxReelsSearch" onSubmit={(e) => e.preventDefault()}>
            <span>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reels, creators..."
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}>
                ×
              </button>
            )}
          </form>

          <section className="vlxReelsStats">
            <div>
              <b>{reels.length}</b>
              <span>Total Reels</span>
            </div>
            <div>
              <b>{filteredReels.length}</b>
              <span>Showing</span>
            </div>
          </section>

          {loading && (
            <section className="vlxReelsState">
              Loading backend reels...
            </section>
          )}

          {!loading && filteredReels.length === 0 && (
            <section className="vlxReelsState">
              <b>No reels found</b>
              <span>{message || 'Upload reels or add backend data.'}</span>
              <a href="/create?type=reel">Upload Reel</a>
            </section>
          )}

          <section className="vlxReelsList">
            {filteredReels.map((reel) => {
              const handle = cleanUsername(reel.username || reel.user || reel.name)
              const displayName = reel.name || handle.replace('@', '') || 'Creator'

              return (
                <article className="vlxReelCard" key={reel.id}>
                  <header className="vlxReelTop">
                    <a
                      href={`/profile?username=${encodeURIComponent(handle)}`}
                      className="vlxReelAvatar"
                    >
                      {validMedia(reel.avatarUrl) ? (
                        <img src={reel.avatarUrl} alt={displayName} />
                      ) : (
                        <span>{firstLetter(displayName)}</span>
                      )}
                    </a>

                    <div>
                      <a href={`/profile?username=${encodeURIComponent(handle)}`}>
                        {displayName}
                      </a>
                      <small>{handle} · {timeLabel(reel.createdAt)}</small>
                    </div>

                    <button type="button">⋮</button>
                  </header>

                  <a href={`/post/${encodeURIComponent(reel.id)}`} className="vlxReelVideo">
                    <ReelVideo reel={reel} />
                    <i>▶</i>
                  </a>

                  <div className="vlxReelBody">
                    <h2>{reel.title || 'Reel'}</h2>
                    {reel.caption && <p>{reel.caption}</p>}

                    <div className="vlxReelActions">
                      <button type="button">♡ {reel.likes || 0}</button>
                      <button type="button">💬 {reel.comments || 0}</button>
                      <button type="button">▶ {reel.views || 0}</button>
                      <button type="button">↗</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
