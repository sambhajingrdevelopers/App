'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

type FeedPost = {
  id: string
  user?: string
  name?: string
  location?: string
  title?: string
  caption?: string
  likes?: string | number
  comments?: string | number
  mediaUrl?: string
  mediaType?: string
  color?: string
  createdAt?: string
}

type FeedReel = {
  id: string
  title?: string
  creator?: string
  username?: string
  name?: string
  caption?: string
  videoUrl?: string
  mediaUrl?: string
  views?: string | number
  likes?: string | number
  color?: string
  createdAt?: string
}

type FeedStory = {
  id?: string
  name?: string
  username?: string
  mediaUrl?: string
  mediaType?: string
  caption?: string
  createdAt?: string
}

type OnlineUser = {
  id: string
  name: string
  username: string
  avatarUrl?: string
  online?: boolean
  hasStory?: boolean
}

type MixedItem = {
  id: string
  kind: 'post' | 'reel' | 'story'
  title: string
  subtitle: string
  username: string
  avatar: string
  mediaUrl: string
  mediaType: string
  likes: string | number
  comments: string | number
  views: string | number
  createdAt?: string
  original: FeedPost | FeedReel | FeedStory
}

function isRealMedia(url?: string) {
  if (!url) return false
  const clean = String(url).trim()
  if (!clean) return false
  return clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:')
}

function firstLetter(value?: string) {
  return (value || 'V').trim().slice(0, 1).toUpperCase()
}

function timeLabel(index: number) {
  const labels = ['2h ago', '5h ago', '1d ago', '2d ago', '3d ago']
  return labels[index % labels.length]
}

export default function HomePage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [reels, setReels] = useState<FeedReel[]>([])
  const [stories, setStories] = useState<FeedStory[]>([])
  const [followedUsers, setFollowedUsers] = useState<OnlineUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadHome() {
    setLoading(true)
    setMessage('')

    try {
      const [feedResponse, reelResponse, storyResponse, onlineResponse] = await Promise.all([
        fetch('/api/feed', { cache: 'no-store' }),
        fetch('/api/reels', { cache: 'no-store' }),
        fetch('/api/stories', { cache: 'no-store' }),
        fetch('/api/home/online-following', { cache: 'no-store' })
      ])

      const feedData = await feedResponse.json().catch(() => ({}))
      const reelData = await reelResponse.json().catch(() => ({}))
      const storyData = await storyResponse.json().catch(() => ({}))
      const onlineData = await onlineResponse.json().catch(() => ({}))

      setPosts(Array.isArray(feedData.posts) ? feedData.posts : [])
      setReels(Array.isArray(reelData.reels) ? reelData.reels : Array.isArray(feedData.reels) ? feedData.reels : [])
      setStories(Array.isArray(storyData.stories) ? storyData.stories : Array.isArray(feedData.stories) ? feedData.stories : [])
      setFollowedUsers(Array.isArray(onlineData.users) ? onlineData.users : [])
    } catch {
      setMessage('Feed refresh failed. Try again.')
      setPosts([])
      setReels([])
      setStories([])
      setFollowedUsers([])
    } finally {
      setLoading(false)
    }
  }

  function goSearch() {
    const q = search.trim()
    if (q) {
      window.location.href = `/search?q=${encodeURIComponent(q)}`
    }
  }

  useEffect(() => {
    loadHome()
  }, [])

  const onlineUsers = useMemo(() => {
    const followed = followedUsers.map((user) => ({
      id: user.id,
      name: user.name || user.username || 'Creator',
      username: user.username || '@you',
      mediaUrl: user.avatarUrl || '',
      online: user.online !== false
    }))

    const storyUsers = stories.map((story, index) => ({
      id: story.id || `story-${index}`,
      name: story.name || story.username || 'Creator',
      username: story.username || '@you',
      mediaUrl: story.mediaUrl || '',
      online: true
    }))

    return [...followed, ...storyUsers]
      .filter((item, index, arr) => arr.findIndex((next) => next.username === item.username) === index)
      .slice(0, 12)
  }, [followedUsers, stories])

  const mixedItems = useMemo<MixedItem[]>(() => {
    const postItems: MixedItem[] = posts.map((post) => ({
      id: post.id,
      kind: 'post',
      title: post.title || 'Creator Post',
      subtitle: post.caption || post.location || 'Post update',
      username: post.user || '@you',
      avatar: post.name || post.user || 'V',
      mediaUrl: post.mediaUrl || '',
      mediaType: post.mediaType || 'image',
      likes: post.likes || 0,
      comments: post.comments || 0,
      views: 0,
      createdAt: post.createdAt,
      original: post
    }))

    const reelItems: MixedItem[] = reels.map((reel) => ({
      id: reel.id,
      kind: 'reel',
      title: reel.title || 'Creator Reel',
      subtitle: reel.caption || 'Reel',
      username: reel.username || reel.creator || '@you',
      avatar: reel.name || reel.creator || reel.username || 'R',
      mediaUrl: reel.videoUrl || reel.mediaUrl || '',
      mediaType: 'video',
      likes: reel.likes || 0,
      comments: 0,
      views: reel.views || 0,
      createdAt: reel.createdAt,
      original: reel
    }))

    const storyItems: MixedItem[] = stories.map((story, index) => ({
      id: story.id || `story-${index}`,
      kind: 'story',
      title: story.name || story.username || 'Story',
      subtitle: story.caption || 'Story update',
      username: story.username || '@you',
      avatar: story.name || story.username || 'S',
      mediaUrl: story.mediaUrl || '',
      mediaType: story.mediaType || 'image',
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: story.createdAt,
      original: story
    }))

    const output: MixedItem[] = []
    const max = Math.max(postItems.length, reelItems.length, storyItems.length)

    for (let index = 0; index < max; index += 1) {
      if (postItems[index]) output.push(postItems[index])
      if (reelItems[index]) output.push(reelItems[index])
      if (reelItems[index + 1]) output.push(reelItems[index + 1])
      if (storyItems[index]) output.push(storyItems[index])
      if (postItems[index + 1]) output.push(postItems[index + 1])
    }

    return output.filter((item, index, arr) => arr.findIndex((next) => next.kind === item.kind && next.id === item.id) === index)
  }, [posts, reels, stories])

  return (
    <AuthGuard>
      <SocialAppShell active="home" title="" subtitle="">
        <section className="mixedHomePage">
          <section className="mixedSearchBar">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') goSearch()
              }}
              placeholder="Search creators, reels, hashtags..."
            />
          </section>

          <section className="mixedStoryRow">
            <a className="mixedCreateStory" href="/create">
              <span>+</span>
              <b>Create</b>
            </a>

            {onlineUsers.length > 0 ? (
              onlineUsers.map((user) => (
                <a className="mixedStoryUser" href={`/profile?username=${encodeURIComponent(user.username)}`} key={user.id}>
                  <div>
                    {isRealMedia(user.mediaUrl) ? (
                      <img src={user.mediaUrl} alt={user.name} />
                    ) : (
                      <span>{firstLetter(user.name)}</span>
                    )}
                    <i />
                  </div>
                  <b>{user.name}</b>
                </a>
              ))
            ) : (
              <div className="mixedStoryHint">
                <b>No followed creators</b>
                <small>Follow creators to see them here.</small>
              </div>
            )}
          </section>

          {message && <div className="vlSettingsMessage">{message}</div>}

          {loading ? (
            <div className="mixedEmptyFeed">Loading feed...</div>
          ) : (
            <section className="mixedFeedGrid">
              {mixedItems.map((item, index) => {
                const isWide = item.kind === 'post' && index % 5 === 0
                const isTall = item.kind === 'reel' || item.kind === 'story'
                const href =
                  item.kind === 'reel'
                    ? `/reel/${encodeURIComponent(item.id)}`
                    : item.kind === 'post'
                      ? `/post/${encodeURIComponent(item.id)}`
                      : '/stories'

                return (
                  <article
                    className={[
                      'mixedFeedCard',
                      isWide ? 'wide' : '',
                      isTall ? 'tall' : '',
                      item.kind
                    ].join(' ')}
                    key={`${item.kind}-${item.id}-${index}`}
                  >
                    <a href={href} className="mixedCardLink">
                      <div className="mixedCardTop">
                        <div className="mixedMiniAvatar">{firstLetter(item.avatar)}</div>
                        <div>
                          <b>{item.username} ✓</b>
                          <span>{item.kind === 'reel' ? 'Reels' : item.kind === 'story' ? 'Stories' : timeLabel(index)}</span>
                        </div>
                        <em>⋮</em>
                      </div>

                      {isRealMedia(item.mediaUrl) ? (
                        <div className="mixedMedia">
                          {item.mediaType === 'video' ? (
                            <video src={item.mediaUrl} muted playsInline controls={item.kind === 'post'} />
                          ) : (
                            <img src={item.mediaUrl} alt={item.title} />
                          )}

                          {item.kind === 'reel' && (
                            <span className="mixedPlay">▶ {item.views || '0'}</span>
                          )}
                        </div>
                      ) : (
                        <div className="mixedTextOnly">
                          <b>{item.title}</b>
                          <span>{item.subtitle}</span>
                        </div>
                      )}

                      <div className="mixedCardBottom">
                        <h3>{item.title}</h3>
                        {item.kind !== 'reel' && <p>{item.subtitle}</p>}

                        {item.kind === 'reel' ? (
                          <span>▶ {item.views || 0} views</span>
                        ) : (
                          <span>♡ {item.likes || 0} • 💬 {item.comments || 0}</span>
                        )}
                      </div>
                    </a>
                  </article>
                )
              })}

              {!loading && mixedItems.length === 0 && (
                <div className="mixedEmptyFeed">
                  <b>No content yet</b>
                  <span>Create posts, reels or stories to build your feed.</span>
                  <a href="/create">Create now</a>
                </div>
              )}
            </section>
          )}
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
