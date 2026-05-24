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
}

type FeedReel = {
  id: string
  title?: string
  creator?: string
  caption?: string
  videoUrl?: string
  mediaUrl?: string
  views?: string | number
  likes?: string | number
  color?: string
}

type FeedStory = {
  id?: string
  name?: string
  username?: string
  mediaUrl?: string
  mediaType?: string
  caption?: string
}

type OnlineUser = {
  id: string
  name: string
  username: string
  avatarUrl?: string
  online?: boolean
  hasStory?: boolean
}

type FeedMode = 'posts' | 'reels' | 'stories'

function isRealMedia(url?: string) {
  if (!url) return false
  const clean = String(url).trim()
  if (!clean) return false
  return clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:')
}

function firstLetter(value?: string) {
  return (value || 'V').trim().slice(0, 1).toUpperCase()
}

export default function HomePage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [reels, setReels] = useState<FeedReel[]>([])
  const [stories, setStories] = useState<FeedStory[]>([])
  const [followedUsers, setFollowedUsers] = useState<OnlineUser[]>([])
  const [mode, setMode] = useState<FeedMode>('posts')
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

      setFollowedUsers(Array.isArray(onlineData.users) ? onlineData.users : [])
      setPosts(Array.isArray(feedData.posts) ? feedData.posts : [])
      setReels(Array.isArray(reelData.reels) ? reelData.reels : Array.isArray(feedData.reels) ? feedData.reels : [])
      setStories(Array.isArray(storyData.stories) ? storyData.stories : Array.isArray(feedData.stories) ? feedData.stories : [])
    } catch {
      setMessage('Could not refresh feed right now.')
      setPosts([])
      setReels([])
      setStories([])
      setFollowedUsers([])
    } finally {
      setLoading(false)
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
      online: user.online !== false,
      hasStory: user.hasStory !== false
    }))

    const storyUsers = stories.map((story, index) => ({
      id: story.id || `story-${index}`,
      name: story.name || story.username || 'Creator',
      username: story.username || '@you',
      mediaUrl: story.mediaUrl || '',
      online: true,
      hasStory: true
    }))

    return [...followed, ...storyUsers]
      .filter((item, index, arr) => arr.findIndex((next) => next.username === item.username) === index)
      .slice(0, 12)
  }, [followedUsers, stories])

  return (
    <AuthGuard>
      <SocialAppShell
        active="home"
        title="Home"
        subtitle="Latest updates from followed creators."
      >
        <section className="cleanHomePage">

          <section className="onlineStoryRow">
            <a className="createStoryCircle" href="/create">
              <span>+</span>
              <b>Create</b>
            </a>

            {onlineUsers.length > 0 ? (
              onlineUsers.map((user) => (
                <a className="onlineStoryItem" href={`/profile?username=${encodeURIComponent(user.username)}`} key={user.id}>
                  <div className="onlineAvatar">
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
              <div className="emptyFollowBox">
                <b>No followed stories yet</b>
                <span>Follow creators or create your first story.</span>
              </div>
            )}
          </section>

          <section className="feedModeTabs">
            <button type="button" className={mode === 'posts' ? 'active' : ''} onClick={() => setMode('posts')}>
              Posts <span>{posts.length}</span>
            </button>
            <button type="button" className={mode === 'reels' ? 'active' : ''} onClick={() => setMode('reels')}>
              Reels <span>{reels.length}</span>
            </button>
            <button type="button" className={mode === 'stories' ? 'active' : ''} onClick={() => setMode('stories')}>
              Stories <span>{stories.length}</span>
            </button>
          </section>

          {message && <div className="vlSettingsMessage">{message}</div>}

          {mode === 'posts' && (
            <section className="cleanPostList">
              {posts.map((post) => (
                <article className="cleanPostCard" key={post.id}>
                  <div className="cleanPostUser">
                    <div className={`cleanAvatar ${post.color || ''}`}>{firstLetter(post.name || post.user)}</div>
                    <div>
                      <b>{post.user || '@you'} ✓</b>
                      <span>{post.location || 'VibeLoop'}</span>
                    </div>
                  </div>

                  {isRealMedia(post.mediaUrl) && (
                    <div className="cleanMediaBox">
                      {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls />
                      ) : (
                        <img src={post.mediaUrl} alt={post.title || post.caption || 'Post media'} />
                      )}
                    </div>
                  )}

                  <div className="cleanPostBody">
                    <h3>{post.title || 'Creator Post'}</h3>
                    <p>{post.caption || ''}</p>
                    <span>♡ {post.likes || 0} likes • 💬 {post.comments || 0} comments</span>
                  </div>
                </article>
              ))}

              {!loading && posts.length === 0 && (
                <div className="cleanEmptyState">
                  <b>No posts yet</b>
                  <span>Create a post or follow creators to see posts here.</span>
                  <a href="/create">Create post</a>
                </div>
              )}
            </section>
          )}

          {mode === 'reels' && (
            <section className="cleanReelGrid">
              {reels.map((reel) => (
                <a className="cleanReelCard" href={`/reel/${encodeURIComponent(reel.id)}`} key={reel.id}>
                  {isRealMedia(reel.videoUrl || reel.mediaUrl) ? (
                    <video src={reel.videoUrl || reel.mediaUrl} muted playsInline />
                  ) : (
                    <div className="reelFallback">▶</div>
                  )}
                  <div>
                    <b>{reel.title || 'Creator Reel'}</b>
                    <span>{reel.views || 0} views</span>
                  </div>
                </a>
              ))}

              {!loading && reels.length === 0 && (
                <div className="cleanEmptyState">
                  <b>No reels yet</b>
                  <span>Upload a video reel from create page.</span>
                  <a href="/create">Create reel</a>
                </div>
              )}
            </section>
          )}

          {mode === 'stories' && (
            <section className="cleanStoryGrid">
              {stories.map((story, index) => (
                <article className="cleanStoryCard" key={story.id || index}>
                  {isRealMedia(story.mediaUrl) ? (
                    story.mediaType === 'video' ? (
                      <video src={story.mediaUrl} controls />
                    ) : (
                      <img src={story.mediaUrl} alt={story.name || 'Story'} />
                    )
                  ) : (
                    <div className="storyFallback">{firstLetter(story.name || story.username)}</div>
                  )}
                  <b>{story.name || story.username || 'Creator'}</b>
                  <span>{story.caption || 'Story update'}</span>
                </article>
              ))}

              {!loading && stories.length === 0 && (
                <div className="cleanEmptyState">
                  <b>No stories yet</b>
                  <span>Follow creators or upload your first story.</span>
                  <a href="/create">Create story</a>
                </div>
              )}
            </section>
          )}
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
