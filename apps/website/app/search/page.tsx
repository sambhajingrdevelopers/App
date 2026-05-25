'use client'

import { useState } from 'react'
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
}

function normalizeUsername(value?: string) {
  const clean = String(value || '').trim()
  if (!clean) return ''
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
  const [followLoading, setFollowLoading] = useState(false)

  async function searchNow() {
    const cleanQuery = query.trim()

    if (!cleanQuery) {
      setResults([])
      setMessage('Type creator name, username, post, reel or story.')
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

  async function followFromSearch() {
    const cleanQuery = query.trim()
    const username = normalizeUsername(cleanQuery)

    if (!username || !username.startsWith('@')) {
      setMessage('Enter username like @creator.test to follow.')
      return
    }

    setFollowLoading(true)
    setMessage('Updating follow status...')

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following: username })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Follow action failed.')
      }

      setMessage(data.message || 'Follow status updated. Check Home online row.')
      await searchNow()
    } catch (error: any) {
      setMessage(error?.message || 'Follow action failed.')
    } finally {
      setFollowLoading(false)
    }
  }

  async function followResult(username?: string) {
    const target = normalizeUsername(username)

    if (!target) {
      setMessage('Creator username missing.')
      return
    }

    setFollowLoading(true)
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
      setFollowLoading(false)
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="search" title="" subtitle="">
        <section className="universalSearchPage">
          <header className="universalSearchHeader">
            <h1>Search</h1>
            <p>Search anything or follow a creator from one bar.</p>
          </header>

          <section className="universalSearchBox">
            <div className="universalSearchInputWrap">
              <span>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    searchNow()
                  }
                }}
                placeholder="Search @creator, posts, reels, stories..."
              />
            </div>

            <div className="universalSearchActions">
              <button type="button" onClick={searchNow} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>

              <button type="button" onClick={followFromSearch} disabled={followLoading}>
                {followLoading ? 'Updating...' : 'Follow @'}
              </button>
            </div>

            {message && <small>{message}</small>}
          </section>

          <section className="universalResultGrid">
            {results.map((item, index) => {
              const username = normalizeUsername(item.username || item.name)
              const title = item.title || item.name || username || 'Creator'
              const caption = item.caption || item.bio || 'Creator content'
              const type = item.type || 'creator'

              return (
                <article className="universalResultCard" key={item.id || `${username}-${index}`}>
                  <div className="universalResultAvatar">
                    {item.avatarUrl || item.mediaUrl ? (
                      <img src={item.avatarUrl || item.mediaUrl} alt={title} />
                    ) : (
                      <span>{firstLetter(title)}</span>
                    )}
                  </div>

                  <div>
                    <small>{type.toUpperCase()} • {username}</small>
                    <h3>{title}</h3>
                    <p>{caption}</p>
                  </div>

                  {username && (
                    <button
                      type="button"
                      onClick={() => followResult(username)}
                      disabled={followLoading}
                    >
                      Follow
                    </button>
                  )}
                </article>
              )
            })}

            {!results.length && !message && (
              <div className="universalEmptyState">
                <b>Start searching</b>
                <span>Use one bar to find creators, posts, reels and stories.</span>
              </div>
            )}
          </section>
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
