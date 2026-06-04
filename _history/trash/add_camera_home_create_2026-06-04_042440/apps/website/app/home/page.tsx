'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type ContentItem = {
  id: string
  kind?: string
  type?: string
  title?: string
  caption?: string
  username?: string
  user?: string
  name?: string
  avatarUrl?: string
  avatar_url?: string
  mediaUrl?: string
  media_url?: string
  videoUrl?: string
  video_url?: string
  mediaType?: string
  media_type?: string
  location?: string
  likes?: number
  comments?: number
  shares?: number
  views?: number
  createdAt?: string
  created_at?: string
}

type SocialState = {
  isLiked: boolean
  isSaved: boolean
  likes: number
  comments: number
  shares: number
}

function cleanUsername(value?: string | null) {
  const text = String(value || '').trim()
  if (!text) return '@creator'
  return text.startsWith('@') ? text : `@${text}`
}

function firstLetter(value?: string) {
  return String(value || 'V').replace('@', '').slice(0, 1).toUpperCase()
}

function validUrl(value?: string) {
  const clean = String(value || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

function mediaSrc(item: ContentItem) {
  return item.videoUrl || item.video_url || item.mediaUrl || item.media_url || ''
}

function mediaType(item: ContentItem) {
  return item.mediaType || item.media_type || (item.videoUrl || item.video_url ? 'video' : 'image')
}

function ownerOf(item: ContentItem) {
  return cleanUsername(item.username || item.user || item.name || '@creator')
}

function kindOf(item: ContentItem) {
  return String(item.kind || item.type || 'post')
}

function timeLabel(value?: string) {
  if (!value) return 'now'
  const t = new Date(value).getTime()
  if (Number.isNaN(t)) return 'now'
  const min = Math.max(1, Math.floor((Date.now() - t) / 60000))
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

function formatCount(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value || 0)
}

function normalize(item: any, fallbackKind: string): ContentItem {
  const username = cleanUsername(item.username || item.user || item.owner || '@creator')

  return {
    id: String(item.id || ''),
    kind: item.kind || item.type || fallbackKind,
    type: item.kind || item.type || fallbackKind,
    title: item.title || fallbackKind,
    caption: item.caption || '',
    username,
    user: username,
    name: item.name || username.replace('@', '') || 'Creator',
    avatarUrl: item.avatarUrl || item.avatar_url || '',
    avatar_url: item.avatarUrl || item.avatar_url || '',
    mediaUrl: item.mediaUrl || item.media_url || '',
    media_url: item.mediaUrl || item.media_url || '',
    videoUrl: item.videoUrl || item.video_url || '',
    video_url: item.videoUrl || item.video_url || '',
    mediaType: item.mediaType || item.media_type || (item.videoUrl || item.video_url ? 'video' : 'image'),
    media_type: item.mediaType || item.media_type || (item.videoUrl || item.video_url ? 'video' : 'image'),
    location: item.location || '',
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    shares: Number(item.shares || 0),
    views: Number(item.views || 0),
    createdAt: item.createdAt || item.created_at || '',
    created_at: item.createdAt || item.created_at || '',
  }
}

function MediaBlock({ item }: { item: ContentItem }) {
  const src = mediaSrc(item)
  const type = mediaType(item)
  const isVideo = type === 'video' || kindOf(item) === 'reel'

  if (!validUrl(src)) {
    return (
      <div className="dynHomeMediaFallback">
        <span>{isVideo ? '▶' : '✦'}</span>
        <b>Media unavailable</b>
      </div>
    )
  }

  if (isVideo) {
    return <video src={src} controls playsInline preload="metadata" />
  }

  return <img src={src} alt={item.title || 'content'} />
}

function StoryCircle({ item }: { item: ContentItem }) {
  const owner = ownerOf(item)

  return (
    <a className="dynHomeStory" href={`/post/${encodeURIComponent(item.id)}`}>
      <span>
        {validUrl(item.avatarUrl || item.avatar_url) ? (
          <img src={item.avatarUrl || item.avatar_url} alt={item.name || owner} />
        ) : (
          <b>{firstLetter(item.name || owner)}</b>
        )}
      </span>
      <small>{item.name || owner.replace('@', '')}</small>
    </a>
  )
}

function CreatorCircle({ item }: { item: ContentItem }) {
  const owner = ownerOf(item)

  return (
    <a className="dynHomeCreator" href={`/profile?username=${encodeURIComponent(owner)}`}>
      <span>
        {validUrl(item.avatarUrl || item.avatar_url) ? (
          <img src={item.avatarUrl || item.avatar_url} alt={item.name || owner} />
        ) : (
          <b>{firstLetter(item.name || owner)}</b>
        )}
        <i />
      </span>
      <small>{item.name || owner.replace('@', '')}</small>
    </a>
  )
}

function FeedCard({
  item,
  state,
  busy,
  onLike,
  onSave,
  onShare,
}: {
  item: ContentItem
  state: SocialState
  busy: boolean
  onLike: (item: ContentItem) => void
  onSave: (item: ContentItem) => void
  onShare: (item: ContentItem) => void
}) {
  const owner = ownerOf(item)
  const kind = kindOf(item)

  return (
    <article className="dynHomePost">
      <header className="dynHomePostHeader">
        <a className="dynHomeAvatar" href={`/profile?username=${encodeURIComponent(owner)}`}>
          {validUrl(item.avatarUrl || item.avatar_url) ? (
            <img src={item.avatarUrl || item.avatar_url} alt={item.name || owner} />
          ) : (
            <b>{firstLetter(item.name || owner)}</b>
          )}
          <i />
        </a>

        <div>
          <a href={`/profile?username=${encodeURIComponent(owner)}`}>
            {item.name || owner.replace('@', '')} <em>✓</em>
          </a>
          <small>{kind} · {timeLabel(item.createdAt || item.created_at)} {item.location ? `· ${item.location}` : ''}</small>
        </div>

        <button type="button">⋮</button>
      </header>

      <a href={`/post/${encodeURIComponent(item.id)}`} className="dynHomeMedia">
        <MediaBlock item={item} />
      </a>

      <section className="dynHomePostBody">
        <h2>{item.title || kind}</h2>
        {item.caption && <p>{item.caption}</p>}

        <div className="dynHomeActions">
          <button type="button" onClick={() => onLike(item)} disabled={busy} className={state.isLiked ? 'active' : ''}>
            {state.isLiked ? '♥' : '♡'} {formatCount(state.likes)}
          </button>

          <a href={`/post/${encodeURIComponent(item.id)}#comments-box`}>
            💬 {formatCount(state.comments)}
          </a>

          <button type="button" onClick={() => onSave(item)} disabled={busy} className={state.isSaved ? 'active' : ''}>
            {state.isSaved ? '🔖' : '🔖'} Save
          </button>

          <button type="button" onClick={() => onShare(item)} disabled={busy}>
            ↗ {formatCount(state.shares)}
          </button>
        </div>
      </section>
    </article>
  )
}

export default function DynamicHomePage() {
  const [me, setMe] = useState('@guest')
  const [posts, setPosts] = useState<ContentItem[]>([])
  const [reels, setReels] = useState<ContentItem[]>([])
  const [stories, setStories] = useState<ContentItem[]>([])
  const [social, setSocial] = useState<Record<string, SocialState>>({})
  const [filter, setFilter] = useState<'all' | 'posts' | 'reels'>('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const feed = useMemo(() => {
    const merged = [
      ...posts.map((item) => ({ ...item, kind: 'post' })),
      ...reels.map((item) => ({ ...item, kind: 'reel' })),
    ].sort((a, b) => String(b.createdAt || b.created_at).localeCompare(String(a.createdAt || a.created_at)))

    if (filter === 'posts') return merged.filter((item) => kindOf(item) === 'post')
    if (filter === 'reels') return merged.filter((item) => kindOf(item) === 'reel')
    return merged
  }, [posts, reels, filter])

  const creators = useMemo(() => {
    const map = new Map<string, ContentItem>()
    ;[...posts, ...reels, ...stories].forEach((item) => {
      const owner = ownerOf(item)
      if (!map.has(owner.toLowerCase())) map.set(owner.toLowerCase(), item)
    })
    return Array.from(map.values()).slice(0, 12)
  }, [posts, reels, stories])

  function initialState(item: ContentItem): SocialState {
    return {
      isLiked: false,
      isSaved: false,
      likes: Number(item.likes || 0),
      comments: Number(item.comments || 0),
      shares: Number(item.shares || 0),
    }
  }

  async function loadSummary(item: ContentItem, currentUser: string) {
    const owner = ownerOf(item)
    const data = await fetch(
      `/api/social/summary?user=${encodeURIComponent(currentUser)}&owner=${encodeURIComponent(owner)}&content_id=${encodeURIComponent(item.id)}&kind=${encodeURIComponent(kindOf(item))}`,
      { cache: 'no-store' }
    )
      .then((res) => res.json())
      .catch(() => null)

    if (!data?.success) return initialState(item)

    return {
      isLiked: Boolean(data.isLiked),
      isSaved: Boolean(data.isSaved),
      likes: Number(data.likes ?? item.likes ?? 0),
      comments: Number(data.comments ?? item.comments ?? 0),
      shares: Number(data.shares ?? item.shares ?? 0),
    }
  }

  async function loadHome() {
    setLoading(true)
    setNotice('')

    const session = await getSessionUser()
    const currentUser = cleanUsername(session.username || '@guest')
    setMe(currentUser)

    const data = await fetch('/api/content/home-live', { cache: 'no-store' })
      .then((res) => res.json())
      .catch(() => ({ success: false, posts: [], reels: [], stories: [], message: 'Home backend failed.' }))

    if (!data.success) {
      setNotice(data.message || 'Home backend failed.')
    }

    const nextPosts = (Array.isArray(data.posts) ? data.posts : []).map((item: any) => normalize(item, 'post'))
    const nextReels = (Array.isArray(data.reels) ? data.reels : []).map((item: any) => normalize(item, 'reel'))
    const nextStories = (Array.isArray(data.stories) ? data.stories : []).map((item: any) => normalize(item, 'story'))

    setPosts(nextPosts)
    setReels(nextReels)
    setStories(nextStories)

    const firstItems = [...nextPosts, ...nextReels].slice(0, 30)
    const entries = await Promise.all(
      firstItems.map(async (item) => [item.id, await loadSummary(item, currentUser)] as const)
    )

    setSocial(Object.fromEntries(entries))
    setLoading(false)
  }

  useEffect(() => {
    loadHome()
  }, [])

  function getState(item: ContentItem) {
    return social[item.id] || initialState(item)
  }

  async function toggleLike(item: ContentItem) {
    if (busy) return
    setBusy(true)

    const owner = ownerOf(item)
    const data = await fetch('/api/social/like/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: me, owner, contentId: item.id, kind: kindOf(item) }),
    })
      .then((res) => res.json())
      .catch(() => ({ success: false, message: 'Like failed.' }))

    setNotice(data.message || 'Updated.')

    if (data.success) {
      setSocial((old) => ({
        ...old,
        [item.id]: {
          ...getState(item),
          isLiked: Boolean(data.isLiked),
          likes: Number(data.likes ?? getState(item).likes),
          comments: Number(data.comments ?? getState(item).comments),
          shares: Number(data.shares ?? getState(item).shares),
        },
      }))
    }

    setBusy(false)
  }

  async function toggleSave(item: ContentItem) {
    if (busy) return
    setBusy(true)

    const owner = ownerOf(item)
    const data = await fetch('/api/social/save/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: me, owner, contentId: item.id, kind: kindOf(item) }),
    })
      .then((res) => res.json())
      .catch(() => ({ success: false, message: 'Save failed.' }))

    setNotice(data.message || 'Updated.')

    if (data.success) {
      setSocial((old) => ({
        ...old,
        [item.id]: {
          ...getState(item),
          isSaved: Boolean(data.isSaved),
        },
      }))
    }

    setBusy(false)
  }

  async function shareItem(item: ContentItem) {
    if (busy) return
    setBusy(true)

    const owner = ownerOf(item)
    const data = await fetch('/api/social/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: me, owner, contentId: item.id, kind: kindOf(item) }),
    })
      .then((res) => res.json())
      .catch(() => ({ success: false, message: 'Share failed.' }))

    setNotice(data.message || 'Updated.')

    if (data.success) {
      setSocial((old) => ({
        ...old,
        [item.id]: {
          ...getState(item),
          shares: Number(data.shares ?? getState(item).shares + 1),
        },
      }))
    }

    setBusy(false)
  }

  return (
    <AuthGuard>
      <SocialAppShell active="home" hideSearch>
        <main className="dynHomePage">
          <header className="dynHomeHeader">
            <div>
              <h1>VibeLoop</h1>
              <p>Real connected social feed</p>
            </div>
            <button type="button" onClick={loadHome}>↻</button>
          </header>

          {notice && <section className="dynHomeNotice">{notice}</section>}

          <section className="dynHomeSearch">
            <span>⚡</span>
            <input placeholder="Search creators, posts, reels..." readOnly />
          </section>

          <section className="dynHomeStories">
            <a className="dynHomeStory create" href="/create">
              <span>+</span>
              <small>Create</small>
            </a>
            {stories.slice(0, 15).map((story) => (
              <StoryCircle key={story.id} item={story} />
            ))}
          </section>

          <section className="dynHomeCreators">
            <div className="dynHomeSectionTitle">
              <h2>Creators</h2>
              <a href="/search">See all</a>
            </div>
            <div>
              {creators.map((item) => (
                <CreatorCircle key={`${ownerOf(item)}-${item.id}`} item={item} />
              ))}
            </div>
          </section>

          <section className="dynHomeFilters">
            <button type="button" onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
            <button type="button" onClick={() => setFilter('posts')} className={filter === 'posts' ? 'active' : ''}>Posts</button>
            <button type="button" onClick={() => setFilter('reels')} className={filter === 'reels' ? 'active' : ''}>Reels</button>
          </section>

          <section className="dynHomeFeed">
            {loading ? (
              <div className="dynHomeState">Loading real feed...</div>
            ) : feed.length === 0 ? (
              <div className="dynHomeState">
                <b>No feed found</b>
                <span>Add posts/reels in backend first.</span>
              </div>
            ) : (
              feed.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  state={getState(item)}
                  busy={busy}
                  onLike={toggleLike}
                  onSave={toggleSave}
                  onShare={shareItem}
                />
              ))
            )}
          </section>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
