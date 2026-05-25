'use client'

import { useEffect, useState } from 'react'
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
  href?: string
}

function normalizeUsername(value?: string) {
  const clean = String(value || '').trim()

  if (!clean) {
    return '@you'
  }

  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickFollowUsername, setQuickFollowUsername] = useState('@creator.test')
  const [followLoading, setFollowLoading] = useState('')

  async function searchNow(nextQuery = query) {
    const cleanQuery = nextQuery.trim()

    setQuery(nextQuery)

    if (!cleanQuery) {
      setResults([])
      setMessage('')
      return
    }

    setLoading(true)
    setMessage('Searching...')

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`, {
        cache: 'no-store'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Search failed')
      }

      setResults(Array.isArray(data.results) ? data.results : [])
      setMessage('')
    } catch (error: any) {
      setResults([])
      setMessage(error?.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  async function followCreator(username?: string) {
    const target = normalizeUsername(username || quickFollowUsername)

    if (!target || target === '@you') {
      setMessage('Enter another creator username.')
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
        throw new Error(data.message || 'Follow action failed')
      }

      setMessage(data.message || 'Follow status updated. Check Home online row.')
    } catch (error: any) {
      setMessage(error?.message || 'Follow action failed')
    } finally {
      setFollowLoading('')
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim()) {
        searchNow(query)
      }
    }, 450)

    return () => clearTimeout(timeout)
  }, [query])

  return (
    <AuthGuard>
      <SocialAppShell
        active="search"
        title="Search"
        subtitle="Find creators, posts, reels and stories."
      >
        <section className="searchCleanPage">

          <section className="quickFollowBox">
            <div>
              <b>Quick Follow</b>
              <span>Follow a creator by username. They will appear in your Home online row.</span>
            </div>

            <div className="quickFollowForm">
              <input
                value={quickFollowUsername}
                onChange={(event) => setQuickFollowUsername(event.target.value)}
                placeholder="@creator.username"
              />
              <button type="button" onClick={() => followCreator()} disabled={Boolean(followLoading)}>
                {followLoading ? 'Updating...' : 'Follow / Unfollow'}
              </button>
            </div>
          </section>

          <section className="searchInputBox">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search creators, posts, reels, stories..."
            />
            <button type="button" onClick={() => searchNow(query)} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </section>

          {message && <div className="vlSettingsMessage">{message}</div>}

          <section className="searchResultGrid">
            {results.map((item, index) => {
              const username = normalizeUsername(item.username || item.name)
              const title = item.title || item.name || username
              const caption = item.caption || item.bio || 'Creator content'
              const type = item.type || 'creator'

              return (
                <article className="searchResultCard" key={item.id || `${username}-${index}`}>
                  <div className="searchResultAvatar">
                    {item.avatarUrl || item.mediaUrl ? (
                      <img src={item.avatarUrl || item.mediaUrl} alt={title} />
                    ) : (
                      <span>{firstLetter(title)}</span>
                    )}
                  </div>

                  <div className="searchResultInfo">
                    <span>{type.toUpperCase()} • {username}</span>
                    <h3>{title}</h3>
                    <p>{caption}</p>
                  </div>

                  <button
                    type="button"
                    className="restoreMiniButton"
                    onClick={() => followCreator(username)}
                    disabled={followLoading === username}
                  >
                    {followLoading === username ? 'Updating...' : 'Follow'}
                  </button>
                </article>
              )
            })}

            {!loading && query.trim() && results.length === 0 && (
              <div className="cleanEmptyState">
                <b>No results found</b>
                <span>Try another username or follow directly using Quick Follow.</span>
              </div>
            )}

            {!loading && !query.trim() && (
              <div className="cleanEmptyState">
                <b>Start searching</b>
                <span>Search creator username, post title, reels or stories.</span>
              </div>
            )}
          </section>
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
