'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

type ReelItem = {
  id: string
  title?: string
  caption?: string
  username?: string
  user?: string
  name?: string
  mediaUrl?: string
  videoUrl?: string
  mediaType?: string
  likes?: number | string
  comments?: number | string
  views?: number | string
  createdAt?: string
}

function username(value?: string) {
  const clean = String(value || '').trim()
  if (!clean) return ''
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

function validMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadReels() {
    setLoading(true)
    setError('')

    try {
      const data = await fetch('/api/reels', {
        cache: 'no-store'
      }).then((res) => res.json())

      const list = Array.isArray(data.reels) ? data.reels : []

      setReels(list)

      if (!data.success) {
        setError(data.message || 'Reels could not load.')
      }
    } catch {
      setReels([])
      setError('Backend connection failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReels()
  }, [])

  return (
    <AuthGuard>
      <SocialAppShell active="reels" title="" subtitle="" hideSearch>
        <main className="cleanReelsPage">
          <header className="cleanReelsHeader">
            <div>
              <h1>Reels</h1>
              <p>Watch latest video reels.</p>
            </div>

            <button type="button" onClick={loadReels}>
              Refresh
            </button>
          </header>

          {loading && (
            <section className="cleanReelsEmpty">
              Loading reels...
            </section>
          )}

          {!loading && reels.length === 0 && (
            <section className="cleanReelsEmpty">
              <b>No reels found</b>
              <span>{error || 'Upload a reel to show it here.'}</span>
              <a href="/create?type=reel">Upload Reel</a>
            </section>
          )}

          <section className="cleanReelsGrid">
            {reels.map((reel) => {
              const handle = username(reel.username || reel.user || reel.name)
              const displayName = reel.name || handle || 'Creator'
              const video = reel.videoUrl || reel.mediaUrl || ''
              const title = reel.title || 'Reel'
              const caption = reel.caption || ''

              return (
                <article className="cleanReelCard" key={reel.id}>
                  <header className="cleanReelUser">
                    <a
                      href={handle ? `/profile?username=${encodeURIComponent(handle)}` : '/profile'}
                      className="cleanReelAvatar"
                    >
                      {firstLetter(displayName)}
                    </a>

                    <div>
                      <a href={handle ? `/profile?username=${encodeURIComponent(handle)}` : '/profile'}>
                        {displayName}
                      </a>
                      {handle && <small>{handle}</small>}
                    </div>

                    <button type="button">⋮</button>
                  </header>

                  <a href={`/post/${encodeURIComponent(reel.id)}`} className="cleanReelMedia">
                    {validMedia(video) ? (
                      <video src={video} controls playsInline preload="metadata" />
                    ) : (
                      <div>
                        <b>Video unavailable</b>
                        <span>Media URL is missing from backend.</span>
                      </div>
                    )}
                  </a>

                  <div className="cleanReelInfo">
                    <h2>{title}</h2>
                    {caption && <p>{caption}</p>}

                    <div className="cleanReelActions">
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
