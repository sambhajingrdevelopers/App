'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type ContentItem = {
  id: string
  title?: string
  caption?: string
  username?: string
  user?: string
  name?: string
  mediaUrl?: string
  videoUrl?: string
  mediaType?: string
  likes?: string | number
  comments?: string | number
  views?: string | number
  createdAt?: string
}

type ProfileUser = {
  userId: string
  username: string
  name: string
  bio: string
  isOwn: boolean
}

function normalizeUsername(value?: string | null) {
  const clean = String(value || '').trim()
  if (!clean) return '@you'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

function isRealMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:')
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileUser>({
    userId: 'USR-YOU',
    username: '@you',
    name: 'Creator',
    bio: 'Digital Creator',
    isOwn: true
  })

  const [posts, setPosts] = useState<ContentItem[]>([])
  const [reels, setReels] = useState<ContentItem[]>([])
  const [stories, setStories] = useState<ContentItem[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'stories'>('posts')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadProfile() {
    setLoading(true)
    setMessage('')

    try {
      const session = await getSessionUser()
      const params = new URLSearchParams(window.location.search)
      const targetUsername = normalizeUsername(params.get('username') || session.username)
      const isOwn = targetUsername === normalizeUsername(session.username)

      const [feedResponse, reelResponse, storyResponse] = await Promise.all([
        fetch('/api/feed', { cache: 'no-store' }),
        fetch('/api/reels', { cache: 'no-store' }),
        fetch('/api/stories', { cache: 'no-store' })
      ])

      const feedData = await feedResponse.json().catch(() => ({}))
      const reelData = await reelResponse.json().catch(() => ({}))
      const storyData = await storyResponse.json().catch(() => ({}))

      const allPosts: ContentItem[] = Array.isArray(feedData.posts) ? feedData.posts : []
      const allReels: ContentItem[] = Array.isArray(reelData.reels)
        ? reelData.reels
        : Array.isArray(feedData.reels)
          ? feedData.reels
          : []
      const allStories: ContentItem[] = Array.isArray(storyData.stories)
        ? storyData.stories
        : Array.isArray(feedData.stories)
          ? feedData.stories
          : []

      const belongsToProfile = (item: ContentItem) => {
        const itemUsername = normalizeUsername(item.username || item.user || item.name)
        return itemUsername === targetUsername
      }

      const profilePosts = allPosts.filter(belongsToProfile)
      const profileReels = allReels.filter(belongsToProfile)
      const profileStories = allStories.filter(belongsToProfile)

      const displayName =
        isOwn
          ? session.name
          : profilePosts[0]?.name ||
            profileReels[0]?.name ||
            profileStories[0]?.name ||
            targetUsername.replace('@', '')

      setProfile({
        userId: session.userId,
        username: targetUsername,
        name: displayName || 'Creator',
        bio: isOwn ? 'Digital Creator • Posts • Reels • Stories' : 'Creator profile',
        isOwn
      })

      setPosts(profilePosts)
      setReels(profileReels)
      setStories(profileStories)
    } catch {
      setMessage('Profile load failed.')
      setPosts([])
      setReels([])
      setStories([])
    } finally {
      setLoading(false)
    }
  }

  async function followProfile() {
    setMessage('Updating follow status...')

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following: profile.username })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Follow action failed.')
      }

      setMessage(data.message || 'Follow status updated.')
    } catch (error: any) {
      setMessage(error?.message || 'Follow action failed.')
    }
  }

  const activeItems = useMemo(() => {
    if (activeTab === 'reels') return reels
    if (activeTab === 'stories') return stories
    return posts
  }, [activeTab, posts, reels, stories])

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="" hideSearch>
        <section className="proProfilePage">
          <article className="proProfileCard">
            <div className="proProfileCover">
              <div className="proCoverGlow" />
            </div>

            <div className="proProfileIdentity">
              <div className="proProfileAvatar">
                {firstLetter(profile.name || profile.username)}
              </div>

              <div className="proProfileInfo">
                <h1>
                  {profile.name}
                  <span>✓</span>
                </h1>
                <b>{profile.username}</b>
                <p>{profile.bio}</p>
                <small>Verified Creator Profile</small>
              </div>
            </div>

            <div className="proProfileActions">
              {profile.isOwn ? (
                <>
                  <a href="/settings">Edit Profile</a>
                  <a href="/create">Create</a>
                  <a href="/trash">Trash</a>
                </>
              ) : (
                <>
                  <button type="button" onClick={followProfile}>Follow</button>
                  <button type="button">Message</button>
                  <button type="button">Share</button>
                </>
              )}
            </div>

            {message && <div className="proProfileMessage">{message}</div>}

            <div className="proProfileStats">
              <div>
                <strong>{posts.length}</strong>
                <span>Posts</span>
              </div>
              <div>
                <strong>{reels.length}</strong>
                <span>Reels</span>
              </div>
              <div>
                <strong>{stories.length}</strong>
                <span>Stories</span>
              </div>
              <div>
                <strong>{posts.length + reels.length + stories.length}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="proProfileTabs">
              <button
                type="button"
                className={activeTab === 'posts' ? 'active' : ''}
                onClick={() => setActiveTab('posts')}
              >
                Posts
              </button>
              <button
                type="button"
                className={activeTab === 'reels' ? 'active' : ''}
                onClick={() => setActiveTab('reels')}
              >
                Reels
              </button>
              <button
                type="button"
                className={activeTab === 'stories' ? 'active' : ''}
                onClick={() => setActiveTab('stories')}
              >
                Stories
              </button>
            </div>
          </article>

          <section className="proProfileGrid">
            {loading && <div className="proProfileEmpty">Loading profile...</div>}

            {!loading && activeItems.map((item) => {
              const media = item.mediaUrl || item.videoUrl || ''
              const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl)

              return (
                <article className="proContentCard" key={item.id}>
                  {isRealMedia(media) ? (
                    <div className="proContentMedia">
                      {isVideo ? (
                        <video src={media} muted playsInline controls />
                      ) : (
                        <img src={media} alt={item.title || 'Profile content'} />
                      )}
                    </div>
                  ) : (
                    <div className="proContentFallback">
                      <span>{activeTab === 'reels' ? '▶' : activeTab === 'stories' ? '◉' : '✦'}</span>
                    </div>
                  )}

                  <div className="proContentBody">
                    <h3>{item.title || 'Creator Content'}</h3>
                    <p>{item.caption || 'Profile update'}</p>
                    <small>
                      {activeTab === 'reels'
                        ? `▶ ${item.views || 0} views`
                        : `♡ ${item.likes || 0} • 💬 ${item.comments || 0}`}
                    </small>
                  </div>
                </article>
              )
            })}

            {!loading && activeItems.length === 0 && (
              <div className="proProfileEmpty">
                <b>No {activeTab} yet</b>
                <span>{profile.isOwn ? 'Create new content from the Create page.' : 'This creator has not published content here yet.'}</span>
                {profile.isOwn && <a href="/create">Create now</a>}
              </div>
            )}
          </section>
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
