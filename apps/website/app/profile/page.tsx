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
}

function normalizeUsername(value?: string) {
  const clean = String(value || '').trim()
  if (!clean) return '@you'
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileUser>({
    userId: 'USR-YOU',
    username: '@you',
    name: 'Creator',
    bio: 'Digital Creator'
  })

  const [posts, setPosts] = useState<ContentItem[]>([])
  const [reels, setReels] = useState<ContentItem[]>([])
  const [stories, setStories] = useState<ContentItem[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'stories'>('posts')
  const [loading, setLoading] = useState(true)

  async function loadProfile() {
    setLoading(true)

    try {
      const session = await getSessionUser()
      const params = new URLSearchParams(window.location.search)
      const targetUsername = normalizeUsername(params.get('username') || session.username)

      setProfile({
        userId: session.userId,
        username: targetUsername,
        name: targetUsername === session.username ? session.name : targetUsername.replace('@', ''),
        bio: 'Digital Creator'
      })

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

      setPosts(allPosts.filter(belongsToProfile))
      setReels(allReels.filter(belongsToProfile))
      setStories(allStories.filter(belongsToProfile))
    } catch {
      setPosts([])
      setReels([])
      setStories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const activeItems = useMemo(() => {
    if (activeTab === 'reels') return reels
    if (activeTab === 'stories') return stories
    return posts
  }, [activeTab, posts, reels, stories])

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="">
        <section className="fixedProfilePage">
          <article className="fixedProfileCard">
            <div className="fixedProfileBanner" />

            <div className="fixedProfileInfo">
              <div className="fixedProfileAvatar">{firstLetter(profile.name || profile.username)}</div>

              <div className="fixedProfileText">
                <h1>
                  {profile.name}
                  <span>✓</span>
                </h1>
                <b>{profile.username}</b>
                <p>{profile.bio}</p>
                <small>Verified Creator Profile</small>
              </div>
            </div>

            <div className="fixedProfileActions">
              <button type="button">Follow</button>
              <button type="button">Message</button>
              <button type="button">Following</button>
            </div>

            <div className="fixedProfileStats">
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
            </div>

            <div className="fixedProfileTabs">
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

          <section className="fixedProfileGrid">
            {loading && <div className="fixedProfileEmpty">Loading profile...</div>}

            {!loading &&
              activeItems.map((item) => {
                const media = item.mediaUrl || item.videoUrl || ''
                const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl)

                return (
                  <article className="fixedProfilePost" key={item.id}>
                    {isRealMedia(media) ? (
                      <div className="fixedProfileMedia">
                        {isVideo ? (
                          <video src={media} muted playsInline controls />
                        ) : (
                          <img src={media} alt={item.title || 'Profile content'} />
                        )}
                      </div>
                    ) : (
                      <div className="fixedProfileTextOnly">
                        <span>{activeTab === 'reels' ? '▶' : activeTab === 'stories' ? '◉' : '✦'}</span>
                      </div>
                    )}

                    <div className="fixedProfilePostBody">
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
              <div className="fixedProfileEmpty">
                <b>No {activeTab} yet</b>
                <span>Create content from the Create page.</span>
              </div>
            )}
          </section>
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
