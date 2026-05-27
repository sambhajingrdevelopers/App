'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

type Creator = {
  id?: string
  name?: string
  username?: string
  avatarUrl?: string
  verified?: boolean
}

type FeedItem = {
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

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

function cleanUsername(value?: string) {
  const clean = String(value || '').trim()
  if (!clean) return '@creator'
  return clean.startsWith('@') ? clean : `@${clean}`
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

function HomeMedia({ item }: { item: FeedItem }) {
  const src = item.videoUrl || item.mediaUrl || ''
  const [failed, setFailed] = useState(!validMedia(src))
  const isVideo =
    item.mediaType === 'video' ||
    item.kind === 'reel' ||
    item.type === 'reel' ||
    Boolean(item.videoUrl)

  if (failed) {
    return (
      <div className="vlxMediaFallback">
        <b>Media unavailable</b>
        <span>Backend media URL missing or failed.</span>
      </div>
    )
  }

  if (isVideo) {
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

  return (
    <img
      src={src}
      alt={item.title || 'post'}
      onError={() => setFailed(true)}
    />
  )
}

export default function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creators, setCreators] = useState<Creator[]>([])
  const [posts, setPosts] = useState<FeedItem[]>([])
  const [reels, setReels] = useState<FeedItem[]>([])
  const [stories, setStories] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadHome() {
    setLoading(true)
    setError('')

    try {
      const [feedData, creatorsData] = await Promise.all([
        fetch('/api/feed', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/home/online-following', { cache: 'no-store' }).then((r) => r.json())
      ])

      setPosts(Array.isArray(feedData.posts) ? feedData.posts : [])
      setReels(Array.isArray(feedData.reels) ? feedData.reels : [])
      setStories(Array.isArray(feedData.stories) ? feedData.stories : [])
      setCreators(Array.isArray(creatorsData.users) ? creatorsData.users : [])

      if (!feedData.success) {
        setError(feedData.message || 'Backend feed failed.')
      }
    } catch {
      setError('Backend connection failed.')
      setPosts([])
      setReels([])
      setStories([])
      setCreators([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHome()
  }, [])

  const feed = useMemo(() => {
    const mixed = [...posts, ...reels]
    const q = query.trim().toLowerCase()

    const sorted = mixed.sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    )

    if (!q) return sorted

    return sorted.filter((item) =>
      [
        item.title,
        item.caption,
        item.username,
        item.user,
        item.name
      ].some((value) => String(value || '').toLowerCase().includes(q))
    )
  }, [posts, reels, query])

  return (
    <AuthGuard>
      <SocialAppShell active="home" title="" subtitle="" hideSearch>
        <main className="vlxHome">
          <header className="vlxHomeHeader">
            <a href="/home" className="vlxLogo">
              Vibe<span>Loop</span>
            </a>

            <div className="vlxTopActions">
              <button
                type="button"
                onClick={() => setSearchOpen((old) => !old)}
                className={searchOpen ? 'active' : ''}
                aria-label="Search"
              >
                ⚡⌕
              </button>

              <a href="/notifications" aria-label="Notifications">
                🔔
              </a>

              <a href="/messages" aria-label="Messages">
                ✉
              </a>
            </div>
          </header>

          {searchOpen && (
            <form className="vlxSearchBar" onSubmit={(e) => e.preventDefault()}>
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts, reels, creators..."
                autoFocus
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                ×
              </button>
            </form>
          )}

          <section className="vlxStories" aria-label="Stories">
            <a className="vlxCreateStory" href="/create?type=story">
              <span>+</span>
              <b>Create</b>
            </a>

            {creators.map((creator) => {
              const handle = cleanUsername(creator.username || creator.name)

              return (
                <a
                  className="vlxStory"
                  href={`/profile?username=${encodeURIComponent(handle)}`}
                  key={creator.id || handle}
                >
                  <div>
                    {validMedia(creator.avatarUrl) ? (
                      <img src={creator.avatarUrl} alt={creator.name || handle} />
                    ) : (
                      <span>{firstLetter(creator.name || handle)}</span>
                    )}
                    <i />
                  </div>
                  <b>{creator.name || handle}</b>
                </a>
              )
            })}
          </section>

          {loading && (
            <section className="vlxState">
              Loading backend feed...
            </section>
          )}

          {!loading && feed.length === 0 && (
            <section className="vlxState">
              <b>No content found</b>
              <span>{error || 'Upload posts/reels or seed backend content.'}</span>
              <div>
                <a href="/create?type=post">Create Post</a>
                <button type="button" onClick={loadHome}>Refresh</button>
              </div>
            </section>
          )}

          <section className="vlxFeed">
            {feed.map((item) => {
              const handle = cleanUsername(item.username || item.user || item.name)
              const displayName = item.name || handle.replace('@', '') || 'Creator'
              const kind = item.kind || item.type || (item.videoUrl ? 'reel' : 'post')
              const isReel = kind === 'reel'

              return (
                <article className="vlxPost" key={item.id}>
                  <header className="vlxPostHeader">
                    <a
                      href={`/profile?username=${encodeURIComponent(handle)}`}
                      className="vlxAvatar"
                    >
                      {validMedia(item.avatarUrl) ? (
                        <img src={item.avatarUrl} alt={displayName} />
                      ) : (
                        <span>{firstLetter(displayName)}</span>
                      )}
                    </a>

                    <div>
                      <a href={`/profile?username=${encodeURIComponent(handle)}`}>
                        {handle} <em>✓</em>
                      </a>
                      <small>{isReel ? 'Reel' : 'Post'} · {timeLabel(item.createdAt)}</small>
                    </div>

                    <button type="button">⋮</button>
                  </header>

                  <a href={`/post/${encodeURIComponent(item.id)}`} className="vlxPostMedia">
                    <HomeMedia item={item} />
                    {isReel && <i>▶</i>}
                  </a>

                  <div className="vlxPostBody">
                    <h2>{item.title || (isReel ? 'Reel' : 'Post')}</h2>
                    {item.caption && <p>{item.caption}</p>}

                    <div className="vlxPostActions">
                      <button type="button">♡ {item.likes || 0}</button>
                      <button type="button">💬 {item.comments || 0}</button>
                      <button type="button">▶ {item.views || 0}</button>
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
