'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

type Creator = {
  id?: string
  name?: string
  username?: string
  avatarUrl?: string
  bio?: string
  verified?: boolean
  followers?: number | string
}

type ContentItem = {
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
  views?: number | string
}

type Tab = 'all' | 'creators' | 'posts' | 'reels' | 'stories'

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

function SearchMedia({ item }: { item: ContentItem }) {
  const src = item.videoUrl || item.mediaUrl || ''
  const isVideo =
    item.mediaType === 'video' ||
    item.kind === 'reel' ||
    item.type === 'reel' ||
    Boolean(item.videoUrl)

  if (!validMedia(src)) {
    return (
      <div className="vlxSearchFallback">
        <span>{isVideo ? '▶' : '✦'}</span>
      </div>
    )
  }

  if (isVideo) {
    return <video src={src} muted playsInline preload="metadata" />
  }

  return <img src={src} alt={item.title || 'content'} />
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [creators, setCreators] = useState<Creator[]>([])
  const [posts, setPosts] = useState<ContentItem[]>([])
  const [reels, setReels] = useState<ContentItem[]>([])
  const [stories, setStories] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadSearch(searchText = query) {
    setLoading(true)
    setMessage('')

    try {
      const data = await fetch(`/api/search/all?q=${encodeURIComponent(searchText)}`, {
        cache: 'no-store'
      }).then((res) => res.json())

      setCreators(Array.isArray(data.creators) ? data.creators : [])
      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setReels(Array.isArray(data.reels) ? data.reels : [])
      setStories(Array.isArray(data.stories) ? data.stories : [])

      if (!data.success) {
        setMessage(data.message || 'Search failed.')
      }
    } catch {
      setCreators([])
      setPosts([])
      setReels([])
      setStories([])
      setMessage('Backend search connection failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSearch('')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSearch(query)
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  const totalResults = creators.length + posts.length + reels.length + stories.length

  const contentItems = useMemo(() => {
    if (tab === 'posts') return posts
    if (tab === 'reels') return reels
    if (tab === 'stories') return stories
    return [...posts, ...reels, ...stories]
  }, [tab, posts, reels, stories])

  return (
    <AuthGuard>
      <SocialAppShell active="creators" title="" subtitle="" hideSearch>
        <main className="vlxSearchPage">
          <header className="vlxSearchHeader">
            <div>
              <h1>Search</h1>
              <p>Find creators, posts, reels and stories from backend.</p>
            </div>
          </header>

          <form className="vlxSearchBox" onSubmit={(e) => e.preventDefault()}>
            <span>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators, posts, reels..."
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}>
                ×
              </button>
            )}
          </form>

          <nav className="vlxSearchTabs">
            {[
              ['all', 'All'],
              ['creators', 'Creators'],
              ['posts', 'Posts'],
              ['reels', 'Reels'],
              ['stories', 'Stories']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key as Tab)}
                className={tab === key ? 'active' : ''}
              >
                {label}
              </button>
            ))}
          </nav>

          <section className="vlxSearchStats">
            <div>
              <b>{creators.length}</b>
              <span>Creators</span>
            </div>
            <div>
              <b>{posts.length}</b>
              <span>Posts</span>
            </div>
            <div>
              <b>{reels.length}</b>
              <span>Reels</span>
            </div>
            <div>
              <b>{stories.length}</b>
              <span>Stories</span>
            </div>
          </section>

          {loading && (
            <section className="vlxSearchState">
              Loading backend search...
            </section>
          )}

          {!loading && totalResults === 0 && (
            <section className="vlxSearchState">
              <b>No result found</b>
              <span>{message || 'Try another keyword or add backend data.'}</span>
            </section>
          )}

          {!loading && (tab === 'all' || tab === 'creators') && creators.length > 0 && (
            <section className="vlxCreatorSection">
              <div className="vlxSectionTitle">
                <h2>Creators</h2>
                <span>{creators.length}</span>
              </div>

              <div className="vlxCreatorGrid">
                {creators.map((creator) => {
                  const handle = cleanUsername(creator.username || creator.name)

                  return (
                    <a
                      className="vlxCreatorCard"
                      href={`/profile?username=${encodeURIComponent(handle)}`}
                      key={creator.id || handle}
                    >
                      <div className="vlxCreatorAvatar">
                        {validMedia(creator.avatarUrl) ? (
                          <img src={creator.avatarUrl} alt={creator.name || handle} />
                        ) : (
                          <span>{firstLetter(creator.name || handle)}</span>
                        )}
                        {creator.verified !== false && <i>✓</i>}
                      </div>

                      <div>
                        <h3>{creator.name || handle}</h3>
                        <p>{handle}</p>
                        {creator.bio && <small>{creator.bio}</small>}
                      </div>
                    </a>
                  )
                })}
              </div>
            </section>
          )}

          {!loading && tab !== 'creators' && contentItems.length > 0 && (
            <section className="vlxSearchContent">
              <div className="vlxSectionTitle">
                <h2>{tab === 'all' ? 'Content' : tab}</h2>
                <span>{contentItems.length}</span>
              </div>

              <div className="vlxContentGrid">
                {contentItems.map((item) => {
                  const kind = item.kind || item.type || (item.videoUrl ? 'reel' : 'post')

                  return (
                    <a
                      href={`/post/${encodeURIComponent(item.id)}`}
                      className="vlxContentCard"
                      key={item.id}
                    >
                      <div>
                        <SearchMedia item={item} />
                        {kind === 'reel' && <em>▶</em>}
                      </div>

                      <h3>{item.title || kind}</h3>
                      <p>{cleanUsername(item.username || item.user || item.name)}</p>
                    </a>
                  )
                })}
              </div>
            </section>
          )}
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
