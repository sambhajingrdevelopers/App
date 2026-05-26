'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

type Creator = {
  id?: string
  name?: string
  username?: string
  avatarUrl?: string
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

function isMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:')
}

function usernameOf(item: FeedItem) {
  const clean = String(item.username || item.user || item.name || '@creator').trim()
  return clean.startsWith('@') ? clean : `@${clean}`
}

function MediaBlock({ item }: { item: FeedItem }) {
  const src = item.mediaUrl || item.videoUrl || ''
  const isVideo = item.mediaType === 'video' || item.kind === 'reel' || item.type === 'reel' || Boolean(item.videoUrl)
  const [ok, setOk] = useState(Boolean(isMedia(src)))

  if (!ok) {
    return (
      <div className="neoMediaFallback">
        <span>Media loading failed</span>
        <small>{item.title || 'Content preview unavailable'}</small>
      </div>
    )
  }

  if (isVideo) {
    return (
      <video
        src={item.videoUrl || item.mediaUrl}
        controls
        playsInline
        muted
        onError={() => setOk(false)}
      />
    )
  }

  return (
    <img
      src={src}
      alt={item.title || 'post'}
      onError={() => setOk(false)}
    />
  )
}

export default function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creators, setCreators] = useState<Creator[]>([])
  const [posts, setPosts] = useState<FeedItem[]>([])
  const [reels, setReels] = useState<FeedItem[]>([])
  const [stories, setStories] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  async function loadHome() {
    setLoading(true)

    try {
      const [feedData, creatorsData] = await Promise.all([
        fetch('/api/feed', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/home/online-following', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}))
      ])

      setPosts(Array.isArray(feedData.posts) ? feedData.posts : [])
      setReels(Array.isArray(feedData.reels) ? feedData.reels : [])
      setStories(Array.isArray(feedData.stories) ? feedData.stories : [])

      const list = Array.isArray(creatorsData.users)
        ? creatorsData.users
        : Array.isArray(creatorsData.creators)
          ? creatorsData.creators
          : []

      setCreators(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHome()
  }, [])

  const mixedFeed = useMemo(() => {
    const items = [...posts, ...reels]
    return items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  }, [posts, reels])

  const filteredFeed = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return mixedFeed

    return mixedFeed.filter((item) => {
      return [
        item.title,
        item.caption,
        item.username,
        item.user,
        item.name
      ].some((value) => String(value || '').toLowerCase().includes(q))
    })
  }, [mixedFeed, search])

  return (
    <AuthGuard>
      <SocialAppShell active="home" title="" subtitle="" hideSearch>
        <section className="neoHome">
          <header className="neoHomeTop">
            <a href="/home" className="neoBrand">
              Vibe<span>Loop</span>
            </a>

            <div className="neoTopActions">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className={searchOpen ? 'active' : ''}
                aria-label="Search"
              >
                ⚡⌕
              </button>

              <a href="/notifications">
                🔔
                <i>1</i>
              </a>
            </div>
          </header>

          {searchOpen && (
            <form className="neoExpSearch" onSubmit={(e) => e.preventDefault()}>
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators, posts, reels..."
                autoFocus
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                ×
              </button>
            </form>
          )}

          <section className="neoStories">
            <a className="neoStoryCreate" href="/create?type=story">
              <span>+</span>
              <b>Create</b>
            </a>

            {creators.map((creator, index) => {
              const username = creator.username || creator.name || '@creator'

              return (
                <a
                  className="neoStory"
                  href={`/profile?username=${encodeURIComponent(username)}`}
                  key={creator.id || username || index}
                >
                  <div>
                    {isMedia(creator.avatarUrl) ? (
                      <img src={creator.avatarUrl} alt={creator.name || username} />
                    ) : (
                      <span>{firstLetter(creator.name || username)}</span>
                    )}
                    <i />
                  </div>
                  <b>{creator.name || username}</b>
                </a>
              )
            })}
          </section>

          {loading && <div className="neoHomeState">Loading feed...</div>}

          {!loading && filteredFeed.length === 0 && (
            <div className="neoHomeState">
              <b>No posts yet</b>
              <span>Create a post/reel or follow creators.</span>
              <a href="/create">Create now</a>
            </div>
          )}

          <section className="neoFeed">
            {filteredFeed.map((item) => {
              const username = usernameOf(item)
              const name = item.name || username.replace('@', '') || 'Creator'
              const isReel = item.kind === 'reel' || item.type === 'reel'

              return (
                <article className="neoPostCard" key={item.id}>
                  <header className="neoPostHead">
                    <a href={`/profile?username=${encodeURIComponent(username)}`} className="neoPostAvatar">
                      {firstLetter(name)}
                    </a>

                    <div>
                      <a href={`/profile?username=${encodeURIComponent(username)}`}>
                        {username} <span>✓</span>
                      </a>
                      <small>{isReel ? 'Reel' : 'Post'} · 2h ago</small>
                    </div>

                    <button type="button">⋮</button>
                  </header>

                  <a href={`/post/${encodeURIComponent(item.id)}`} className="neoPostMedia">
                    <MediaBlock item={item} />
                    {isReel && <em>▶</em>}
                  </a>

                  <div className="neoPostBody">
                    <h2>{item.title || (isReel ? 'New Reel' : 'New Post')}</h2>
                    <p>{item.caption || 'Creator update'}</p>

                    <div className="neoPostActions">
                      <button type="button">♡ {item.likes || 0}</button>
                      <button type="button">💬 {item.comments || 0}</button>
                      <button type="button">↗ Share</button>
                      <button type="button">🔖</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
