'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type UserItem = {
  id: string
  name: string
  username: string
  bio?: string
  avatarUrl?: string
  bannerUrl?: string
  verified?: boolean
  followers?: number
}

type ContentItem = {
  id: string
  kind: string
  type: string
  title?: string
  caption?: string
  username?: string
  name?: string
  avatarUrl?: string
  mediaUrl?: string
  videoUrl?: string
  mediaType?: string
  likes?: number
  comments?: number
  views?: number
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

function MediaPreview({ item }: { item: ContentItem }) {
  const src = item.videoUrl || item.mediaUrl || ''
  const isVideo = item.mediaType === 'video' || item.kind === 'reel' || Boolean(item.videoUrl)

  if (!validMedia(src)) {
    return (
      <div className="vlxSearchMediaFallback">
        <b>{isVideo ? '▶' : '✦'}</b>
      </div>
    )
  }

  if (isVideo) {
    return <video src={src} muted playsInline preload="metadata" />
  }

  return <img src={src} alt={item.title || item.kind} />
}

export default function SearchPage() {
  const [me, setMe] = useState('@you')
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'reels' | 'stories'>('all')
  const [users, setUsers] = useState<UserItem[]>([])
  const [posts, setPosts] = useState<ContentItem[]>([])
  const [reels, setReels] = useState<ContentItem[]>([])
  const [stories, setStories] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  async function loadSearch(searchText?: string) {
    setLoading(true)
    setNotice('')

    const q = typeof searchText === 'string' ? searchText : query

    try {
      const data = await fetch(`/api/search/all?q=${encodeURIComponent(q)}`, {
        cache: 'no-store'
      }).then((res) => res.json())

      setUsers(Array.isArray(data.users) ? data.users : [])
      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setReels(Array.isArray(data.reels) ? data.reels : [])
      setStories(Array.isArray(data.stories) ? data.stories : [])

      if (!data.success) {
        setNotice(data.message || 'Search backend failed.')
      }
    } catch {
      setUsers([])
      setPosts([])
      setReels([])
      setStories([])
      setNotice('Search backend connection failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function boot() {
      const session = await getSessionUser()
      setMe(cleanUsername(session.username))

      const params = new URLSearchParams(window.location.search)
      const q = params.get('q') || ''
      setQuery(q)

      await loadSearch(q)
    }

    boot()
  }, [])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    window.history.replaceState(null, '', `/search?q=${encodeURIComponent(query)}`)
    await loadSearch(query)
  }

  const allContent = useMemo(() => {
    return [...posts, ...reels, ...stories].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    )
  }, [posts, reels, stories])

  const visibleContent = useMemo(() => {
    if (activeTab === 'posts') return posts
    if (activeTab === 'reels') return reels
    if (activeTab === 'stories') return stories
    return allContent
  }, [activeTab, posts, reels, stories, allContent])

  const showUsers = activeTab === 'all' || activeTab === 'users'
  const showContent = activeTab === 'all' || activeTab === 'posts' || activeTab === 'reels' || activeTab === 'stories'

  async function saveItem(item: ContentItem) {
    const data = await fetch('/api/saved/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: me, contentId: item.id, kind: item.kind })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Save failed.'
    }))

    setNotice(data.message || 'Updated.')
  }

  return (
    <AuthGuard>
      <SocialAppShell active="creators" title="" subtitle="" hideSearch>
        <main className="vlxRealSearchPage">
          <header className="vlxRealSearchHeader">
            <div>
              <h1>Search</h1>
              <p>Find real creators, posts, reels and stories from backend.</p>
            </div>

            <button type="button" onClick={() => loadSearch(query)}>Refresh</button>
          </header>

          <form className="vlxRealSearchBar" onSubmit={handleSearch}>
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search creators, posts, reels, stories..."
            />
            <button type="submit">Search</button>
          </form>

          <section className="vlxRealSearchTabs">
            {[
              ['all', 'All'],
              ['users', 'Creators'],
              ['posts', 'Posts'],
              ['reels', 'Reels'],
              ['stories', 'Stories'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={activeTab === key ? 'active' : ''}
                onClick={() => setActiveTab(key as any)}
              >
                {label}
              </button>
            ))}
          </section>

          {notice && <section className="vlxRealSearchNotice">{notice}</section>}

          {loading ? (
            <section className="vlxRealSearchState">Loading search results...</section>
          ) : (
            <>
              {showUsers && (
                <section className="vlxRealSearchSection">
                  <div className="vlxRealSearchSectionTitle">
                    <h2>Creators</h2>
                    <span>{users.length}</span>
                  </div>

                  {users.length === 0 ? (
                    <div className="vlxRealSearchEmpty">No creators found.</div>
                  ) : (
                    <div className="vlxRealCreatorList">
                      {users.map((user) => {
                        const username = cleanUsername(user.username)

                        return (
                          <article className="vlxRealCreatorCard" key={username}>
                            <a href={`/profile?username=${encodeURIComponent(username)}`} className="vlxRealCreatorAvatar">
                              {validMedia(user.avatarUrl) ? (
                                <img src={user.avatarUrl} alt={user.name} />
                              ) : (
                                <b>{firstLetter(user.name || username)}</b>
                              )}
                              <i />
                            </a>

                            <div>
                              <a href={`/profile?username=${encodeURIComponent(username)}`}>
                                {user.name}
                                {user.verified && <em>✓</em>}
                              </a>
                              <p>{username}</p>
                              <small>{user.bio || 'Digital Creator'} · {user.followers || 0} followers</small>

                              <div>
                                <a href={`/profile?username=${encodeURIComponent(username)}`}>Profile</a>
                                <a href={`/messages?to=${encodeURIComponent(username)}`}>Message</a>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </section>
              )}

              {showContent && (
                <section className="vlxRealSearchSection">
                  <div className="vlxRealSearchSectionTitle">
                    <h2>{activeTab === 'all' ? 'Content' : activeTab}</h2>
                    <span>{visibleContent.length}</span>
                  </div>

                  {visibleContent.length === 0 ? (
                    <div className="vlxRealSearchEmpty">No content found.</div>
                  ) : (
                    <div className="vlxRealContentGrid">
                      {visibleContent.map((item) => {
                        const username = cleanUsername(item.username)
                        const name = item.name || username.replace('@', '') || 'Creator'

                        return (
                          <article className="vlxRealContentCard" key={`${item.kind}-${item.id}`}>
                            <a href={`/post/${encodeURIComponent(item.id)}`} className="vlxRealContentMedia">
                              <MediaPreview item={item} />
                              <span>{item.kind}</span>
                            </a>

                            <div className="vlxRealContentBody">
                              <a href={`/profile?username=${encodeURIComponent(username)}`} className="vlxRealContentUser">
                                {name} <em>✓</em>
                              </a>

                              <h3>{item.title || item.kind}</h3>
                              <p>{item.caption || 'Backend connected content.'}</p>
                              <small>
                                {username} · {timeLabel(item.createdAt)} · ♡ {item.likes || 0}
                              </small>

                              <div className="vlxRealContentActions">
                                <a href={`/post/${encodeURIComponent(item.id)}`}>Open</a>
                                <a href={`/messages?to=${encodeURIComponent(username)}`}>Message</a>
                                <button type="button" onClick={() => saveItem(item)}>Save</button>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
