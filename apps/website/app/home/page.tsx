'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

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

type StoryUser = {
  username: string
  name: string
  avatarUrl?: string
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

function Media({ item }: { item: FeedItem }) {
  const src = item.videoUrl || item.mediaUrl || ''
  const isVideo =
    item.mediaType === 'video' ||
    item.kind === 'reel' ||
    item.type === 'reel' ||
    Boolean(item.videoUrl)

  if (!validMedia(src)) {
    return (
      <div className="vlxHomeMediaFallback">
        <b>{isVideo ? '▶' : '✦'}</b>
        <span>Media loading failed</span>
      </div>
    )
  }

  if (isVideo) {
    return <video src={src} controls playsInline preload="metadata" />
  }

  return <img src={src} alt={item.title || 'post'} />
}

export default function HomePage() {
  const [me, setMe] = useState('@you')
  const [posts, setPosts] = useState<FeedItem[]>([])
  const [reels, setReels] = useState<FeedItem[]>([])
  const [stories, setStories] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  async function loadHome() {
    setLoading(true)
    setNotice('')

    try {
      const data = await fetch('/api/content/home', {
        cache: 'no-store'
      }).then((res) => res.json())

      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setReels(Array.isArray(data.reels) ? data.reels : [])
      setStories(Array.isArray(data.stories) ? data.stories : [])

      if (!data.success) {
        setNotice(data.message || 'Home backend failed.')
      }
    } catch {
      setPosts([])
      setReels([])
      setStories([])
      setNotice('Backend home connection failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function boot() {
      const session = await getSessionUser()
      setMe(cleanUsername(session.username))
      await loadHome()
    }

    boot()
  }, [])

  const feed = useMemo(() => {
    return [...posts, ...reels].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    )
  }, [posts, reels])

  const storyUsers = useMemo<StoryUser[]>(() => {
    const map = new Map<string, StoryUser>()

    const all = [...stories, ...posts, ...reels]

    all.forEach((item) => {
      const username = cleanUsername(item.username || item.user || item.name)
      if (!username || map.has(username.toLowerCase())) return

      map.set(username.toLowerCase(), {
        username,
        name: item.name || username.replace('@', '') || 'Creator',
        avatarUrl: item.avatarUrl || ''
      })
    })

    return Array.from(map.values())
  }, [stories, posts, reels])

  async function saveItem(item: FeedItem) {
    const data = await fetch('/api/saved/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: me,
        contentId: item.id,
        kind: item.kind || item.type || 'post'
      })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Save failed.'
    }))

    setNotice(data.message || 'Updated.')
  }

  async function moveToTrash(item: FeedItem) {
    const data = await fetch('/api/trash/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: me,
        contentId: item.id
      })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Move to trash failed.'
    }))

    setNotice(data.message || 'Updated.')

    if (data.success) {
      setPosts((old) => old.filter((post) => post.id !== item.id))
      setReels((old) => old.filter((reel) => reel.id !== item.id))
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="home" title="" subtitle="" hideSearch>
        <main className="vlxHomeCleanPage">
          <section className="vlxHomeStories">
            <a href="/create" className="vlxStoryCreate">
              <span>+</span>
              <small>Create</small>
            </a>

            {storyUsers.map((user) => (
              <a
                href={`/profile?username=${encodeURIComponent(user.username)}`}
                className="vlxStoryUser"
                key={user.username}
              >
                <span>
                  {validMedia(user.avatarUrl) ? (
                    <img src={user.avatarUrl} alt={user.name} />
                  ) : (
                    <b>{firstLetter(user.name)}</b>
                  )}
                  <i />
                </span>
                <small>{user.name}</small>
              </a>
            ))}
          </section>

          {notice && <section className="vlxHomeNotice">{notice}</section>}

          {loading ? (
            <section className="vlxHomeState">Loading feed...</section>
          ) : feed.length === 0 ? (
            <section className="vlxHomeState">
              <b>No feed yet</b>
              <span>Add backend posts, reels and stories.</span>
              <a href="/create">Create Content</a>
            </section>
          ) : (
            <section className="vlxHomeFeed">
              {feed.map((item) => {
                const username = cleanUsername(item.username || item.user || item.name)
                const name = item.name || username.replace('@', '') || 'Creator'
                const isOwner = username.toLowerCase() === me.toLowerCase()
                const kind = item.kind || item.type || (item.videoUrl ? 'reel' : 'post')

                return (
                  <article className="vlxHomePostCard" key={item.id}>
                    <header>
                      <a href={`/profile?username=${encodeURIComponent(username)}`} className="vlxHomeAvatar">
                        {validMedia(item.avatarUrl) ? (
                          <img src={item.avatarUrl} alt={name} />
                        ) : (
                          <span>{firstLetter(name)}</span>
                        )}
                      </a>

                      <div>
                        <a href={`/profile?username=${encodeURIComponent(username)}`}>
                          {username} <em>✓</em>
                        </a>
                        <small>{kind} · {timeLabel(item.createdAt)}</small>
                      </div>

                      <button type="button">⋮</button>
                    </header>

                    <a href={`/post/${encodeURIComponent(item.id)}`} className="vlxHomeMedia">
                      <Media item={item} />
                    </a>

                    <section className="vlxHomePostBody">
                      <h2>{item.title || kind}</h2>
                      {item.caption && <p>{item.caption}</p>}

                      <div className="vlxHomePostActions">
                        <button type="button">♡ {item.likes || 0}</button>
                        <button type="button">💬 {item.comments || 0}</button>
                        <button type="button">▶ {item.views || 0}</button>
                        <button type="button" onClick={() => saveItem(item)}>Save</button>
                        {isOwner && (
                          <button type="button" onClick={() => moveToTrash(item)}>
                            Trash
                          </button>
                        )}
                      </div>
                    </section>
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
