'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

type SearchResult = {
  id?: string
  type?: string
  title?: string
  name?: string
  username?: string
  caption?: string
  bio?: string
  mediaUrl?: string
  avatarUrl?: string
  views?: string | number
  likes?: string | number
}

type DiscoverItem = {
  id: string
  type: 'creator' | 'post' | 'reel' | 'story' | 'hashtag'
  title: string
  subtitle: string
  username?: string
  mediaUrl?: string
  avatarUrl?: string
}

const categories = ['For you', 'Creators', 'Posts', 'Reels', 'Stories']

const trendingTopics = [
  { title: 'Business Website', meta: '24.1K posts' },
  { title: 'App Design', meta: '18.7K posts' },
  { title: '3D UI', meta: '12.9K posts' },
  { title: 'Brand Growth', meta: '9.4K posts' }
]

const fallbackCreators = [
  { name: 'Sambhajingr Dev', username: '@sambhajingr' },
  { name: 'Design Studio', username: '@design.studio' },
  { name: 'Creative Hub', username: '@creativehub' },
  { name: 'VibeLoop Creator', username: '@vibeloop' }
]

function normalizeUsername(value?: string) {
  const clean = String(value || '').trim()
  if (!clean) return ''
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

function isRealMedia(url?: string) {
  if (!url) return false
  const clean = String(url).trim()
  return clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:')
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('For you')
  const [results, setResults] = useState<SearchResult[]>([])
  const [discover, setDiscover] = useState<DiscoverItem[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState('')

  // AUTO_REAL_USER_SEARCH
  useEffect(() => {
    const clean = query.trim()

    if (!clean) {
      setResults([])
      setMessage('')
      return
    }

    const timer = setTimeout(() => {
      searchNow(clean)
    }, 450)

    return () => clearTimeout(timer)
  }, [query])


  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('vibeloop_recent_searches') || '[]')
    if (Array.isArray(saved)) setRecent(saved.slice(0, 6))

    Promise.all([
      fetch('/api/feed', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/reels', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/home/online-following', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}))
    ]).then(([feedData, reelData, onlineData]) => {
      const postItems: DiscoverItem[] = (feedData.posts || []).slice(0, 4).map((post: any) => ({
        id: post.id,
        type: 'post',
        title: post.title || 'Creator Post',
        subtitle: post.caption || 'Live post',
        username: post.user || post.username || '@creator',
        mediaUrl: post.mediaUrl
      }))

      const reelItems: DiscoverItem[] = (reelData.reels || feedData.reels || []).slice(0, 4).map((reel: any) => ({
        id: reel.id,
        type: 'reel',
        title: reel.title || 'Creator Reel',
        subtitle: `${reel.views || 0} views`,
        username: reel.username || reel.creator || '@creator',
        mediaUrl: reel.videoUrl || reel.mediaUrl
      }))

      const creatorItems: DiscoverItem[] = (onlineData.users || []).slice(0, 5).map((user: any) => ({
        id: user.id || user.username,
        type: 'creator',
        title: user.name || user.username || 'Creator',
        subtitle: user.username || '@creator',
        username: user.username,
        avatarUrl: user.avatarUrl
      }))

      setDiscover([...creatorItems, ...reelItems, ...postItems])
    })
  }, [])

  const popularCreators = useMemo(() => {
    const liveCreators = discover.filter((item) => item.type === 'creator')

    if (liveCreators.length) {
      return liveCreators.slice(0, 5)
    }

    return fallbackCreators.map((creator, index) => ({
      id: `fallback-${index}`,
      type: 'creator' as const,
      title: creator.name,
      subtitle: creator.username,
      username: creator.username
    }))
  }, [discover])

  const suggestedItems = useMemo(() => {
    const items = discover.filter((item) => item.type !== 'creator').slice(0, 6)

    if (items.length) return items

    return [
      {
        id: 'trend-post',
        type: 'post' as const,
        title: 'Premium Website Showcase',
        subtitle: 'by @sambhajingr',
        username: '@sambhajingr',
        mediaUrl: ''
      },
      {
        id: 'trend-reel',
        type: 'reel' as const,
        title: '3D UI Motion Preview',
        subtitle: '124K views',
        username: '@design.studio',
        mediaUrl: ''
      },
      {
        id: 'trend-hashtag',
        type: 'hashtag' as const,
        title: '#AdvancedDesign',
        subtitle: '18.7K posts',
        username: '',
        mediaUrl: ''
      }
    ]
  }, [discover])

  const reelSuggestions = useMemo(() => {
    const liveReels = discover.filter((item) => item.type === 'reel').slice(0, 6)

    if (liveReels.length) return liveReels

    return [
      {
        id: 'reel-website-preview',
        type: 'reel' as const,
        title: 'Website Preview Motion',
        subtitle: '1.2K views',
        username: '@sambhajingrdevelopers',
        mediaUrl: ''
      },
      {
        id: 'reel-ui-motion',
        type: 'reel' as const,
        title: '3D UI Motion Preview',
        subtitle: '940 views',
        username: '@design.studio',
        mediaUrl: ''
      },
      {
        id: 'reel-workflow',
        type: 'reel' as const,
        title: 'Creative Workflow',
        subtitle: '720 views',
        username: '@creativehub',
        mediaUrl: ''
      }
    ]
  }, [discover])

  function saveRecent(value: string) {
    const clean = value.trim()
    if (!clean) return

    const next = [clean, ...recent.filter((item) => item !== clean)].slice(0, 6)
    setRecent(next)
    localStorage.setItem('vibeloop_recent_searches', JSON.stringify(next))
  }

  async function searchNow(nextQuery = query) {
    const cleanQuery = nextQuery.trim()

    if (!cleanQuery) {
      setResults([])
      setMessage('Type something to search.')
      return
    }

    setLoading(true)
    setMessage('Searching...')
    saveRecent(cleanQuery)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`, {
        cache: 'no-store'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Search failed.')
      }

      const list = Array.isArray(data.results) ? data.results : []
      setResults(list)
      setMessage(list.length ? '' : 'No result found.')
    } catch (error: any) {
      setResults([])
      setMessage(error?.message || 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  async function followCreator(username?: string) {
    const target = normalizeUsername(username || query)

    if (!target) {
      setMessage('Enter creator username to follow.')
      return
    }

    setFollowLoading(target)
    setMessage('Updating follow status...')

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following: target })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Follow action failed.')
      }

      setMessage(data.message || 'Follow status updated.')
    } catch (error: any) {
      setMessage(error?.message || 'Follow action failed.')
    } finally {
      setFollowLoading('')
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="search" title="" subtitle="">
        <section className="premiumSearchPage">
          <header className="premiumSearchHero">
            <div>
              <h1>Search</h1>
              <p>Discover creators, content and trends.</p>
            </div>
            <button type="button" aria-label="Smart discovery">✧</button>
          </header>

          <section className="premiumSearchBar">
            <span className="premiumSearchIcon">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') searchNow()
              }}
              placeholder="Search creators, posts, reels, hashtags..."
            />
            <button type="button" onClick={() => searchNow()} disabled={loading} aria-label="Search">
              {loading ? '…' : '↵'}
            </button>
            <button type="button" onClick={() => followCreator()} disabled={Boolean(followLoading)} aria-label="Follow creator">
              +
            </button>
          </section>

          <nav className="premiumCategoryChips">
            {categories.map((category) => (
              <button
                type="button"
                className={activeCategory === category ? 'active' : ''}
                onClick={() => setActiveCategory(category)}
                key={category}
              >
                {category}
              </button>
            ))}
          </nav>

          {message && <div className="premiumSearchMessage">{message}</div>}

          {results.length > 0 && (
            <section className="premiumSearchResults">
              <div className="premiumSectionTitle">
                <h2>Results</h2>
              </div>

              <div className="premiumResultList">
                {results.map((item, index) => {
                  const username = normalizeUsername(item.username || item.name)
                  const title = item.title || item.name || username || 'Creator'
                  const caption = item.caption || item.bio || 'Creator content'
                  const type = item.type || 'creator'

                  return (
                    <article className="premiumResultItem" key={item.id || `${username}-${index}`}>
                      <div className="premiumMiniAvatar">
                        {isRealMedia(item.avatarUrl || item.mediaUrl) ? (
                          <img src={item.avatarUrl || item.mediaUrl} alt={title} />
                        ) : (
                          <span>{firstLetter(title)}</span>
                        )}
                      </div>

                      <div>
                        <small>{String(type).toUpperCase()} • {username}</small>
                        <h3>{title}</h3>
                        <p>{caption}</p>
                      </div>

                      {username && (
                        <button
                          type="button"
                          onClick={() => followCreator(username)}
                          disabled={followLoading === username}
                        >
                          {followLoading === username ? '...' : 'Follow'}
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          <section className="premiumTrendingSection">
            <div className="premiumSectionTitle">
              <h2>Trending now</h2>
              <a href="/search">See all</a>
            </div>

            <div className="premiumTrendingScroller">
              {trendingTopics.map((topic) => (
                <button
                  type="button"
                  className="premiumTrendCard"
                  onClick={() => {
                    setQuery(topic.title)
                    searchNow(topic.title)
                  }}
                  key={topic.title}
                >
                  <span>#</span>
                  <div>
                    <b>{topic.title}</b>
                    <small>{topic.meta}</small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="premiumCreatorsPanel">
            <div className="premiumSectionTitle">
              <h2>Popular creators</h2>
              <a href="/search">See all</a>
            </div>

            <div className="premiumCreatorRow">
              {popularCreators.map((creator) => (
                <button
                  type="button"
                  className="premiumCreator"
                  onClick={() => followCreator(creator.username || creator.subtitle)}
                  key={creator.id}
                >
                  <div>
                    {isRealMedia(creator.avatarUrl) ? (
                      <img src={creator.avatarUrl} alt={creator.title} />
                    ) : (
                      <span>{firstLetter(creator.title)}</span>
                    )}
                    <i>✓</i>
                  </div>
                  <b>{creator.title}</b>
                  <small>{creator.subtitle}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="premiumSuggestedPanel premiumReelsPanel">
            <div className="premiumSectionTitle">
              <h2>Reels for you</h2>
              <a href="/search">See all</a>
            </div>

            <div className="premiumSuggestionGrid">
              {reelSuggestions.slice(0, 6).map((item) => (
                <article className="premiumSuggestionCard" key={item.id}>
                  <div className="premiumSuggestionMedia">
                    {isRealMedia(item.mediaUrl) ? (
                      item.type === 'reel' ? (
                        <video src={item.mediaUrl} muted playsInline />
                      ) : (
                        <img src={item.mediaUrl} alt={item.title} />
                      )
                    ) : (
                      <span>{item.type === 'hashtag' ? '#' : firstLetter(item.title)}</span>
                    )}
                    <em>{item.type}</em>
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="premiumRecentPanel">
            <div className="premiumSectionTitle">
              <h2>Recent searches</h2>
              {recent.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRecent([])
                    localStorage.removeItem('vibeloop_recent_searches')
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="premiumRecentChips">
              {(recent.length ? recent : ['app design', 'business website', '3D UI', 'creator']).map((item) => (
                <button
                  type="button"
                  onClick={() => {
                    setQuery(item)
                    searchNow(item)
                  }}
                  key={item}
                >
                  ◷ {item}
                </button>
              ))}
            </div>
          </section>
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
