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
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

function cleanUsername(value?: string) {
  const clean = String(value || '@creator').trim()
  return clean.startsWith('@') ? clean : `@${clean}`
}

function isVideoUrl(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

export default function ReelsPage() {
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

      if (list.length === 0) {
        setMessage('No backend reels found. Run backend seed or upload a reel.')
      }
    } catch {
      setMessage('Reels API failed. Backend may not be running.')
      setReels([])
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
        <main className="realBackendReelsPage">
          <header className="realBackendReelsHeader">
            <div>
              <h1>Reels</h1>
              <p>Backend video reels from real content database.</p>
            </div>

            <button type="button" onClick={loadReels}>
              Refresh
            </button>
          </header>

          {loading && (
            <section className="realReelsState">
              Loading backend reels...
            </section>
          )}

          {!loading && reels.length === 0 && (
            <section className="realReelsState">
              <b>No reels yet</b>
              <span>{message}</span>
              <a href="/create?type=reel">Upload Reel</a>
            </section>
          )}

          <section className="realReelsList">
            {reels.map((reel) => {
              const username = cleanUsername(reel.username || reel.user || reel.name)
              const creatorName = reel.name || username.replace('@', '')
              const video = reel.videoUrl || reel.mediaUrl || ''

              return (
                <article className="realReelCard" key={reel.id}>
                  <div className="realReelTop">
                    <a href={`/profile?username=${encodeURIComponent(username)}`} className="realReelAvatar">
                      {firstLetter(creatorName)}
                    </a>

                    <div>
                      <a href={`/profile?username=${encodeURIComponent(username)}`}>
                        {username} <span>✓</span>
                      </a>
                      <small>Backend reel · {reel.views || 0} views</small>
                    </div>

                    <button type="button">⋮</button>
                  </div>

                  <a href={`/post/${encodeURIComponent(reel.id)}`} className="realReelVideoBox">
                    {isVideoUrl(video) ? (
                      <video
                        src={video}
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="realReelMissing">
                        <b>Video missing</b>
                        <span>{reel.title || 'Reel video not available'}</span>
                      </div>
                    )}
                  </a>

                  <div className="realReelBody">
                    <h2>{reel.title || 'Backend Reel'}</h2>
                    <p>{reel.caption || 'Video reel loaded from backend.'}</p>

                    <div className="realReelActions">
                      <button type="button">♡ {reel.likes || 0}</button>
                      <button type="button">💬 {reel.comments || 0}</button>
                      <button type="button">↗ Share</button>
                      <button type="button">🔖</button>
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
