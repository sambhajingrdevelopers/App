'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type Item = {
  id: string
  title?: string
  caption?: string
  username?: string
  user?: string
  name?: string
  mediaUrl?: string
  videoUrl?: string
  mediaType?: string
  likes?: number | string
  comments?: number | string
  views?: number | string
}

type Profile = {
  userId: string
  name: string
  username: string
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

function validMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:')
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    userId: 'USR-YOU',
    name: 'Creator',
    username: '@you',
    bio: 'Digital Creator',
    isOwn: true
  })

  const [posts, setPosts] = useState<Item[]>([])
  const [reels, setReels] = useState<Item[]>([])
  const [stories, setStories] = useState<Item[]>([])
  const [tab, setTab] = useState<'posts' | 'reels' | 'stories'>('posts')
  const [loading, setLoading] = useState(true)

  async function loadProfile() {
    setLoading(true)

    try {
      const session = await getSessionUser()
      const params = new URLSearchParams(window.location.search)
      const targetUsername = normalizeUsername(params.get('username') || session.username)
      const isOwn = targetUsername === normalizeUsername(session.username)

      const [feedData, reelsData, storiesData] = await Promise.all([
        fetch('/api/feed', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/reels', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/stories', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}))
      ])

      const allPosts: Item[] = Array.isArray(feedData.posts) ? feedData.posts : []
      const allReels: Item[] = Array.isArray(reelsData.reels)
        ? reelsData.reels
        : Array.isArray(feedData.reels)
          ? feedData.reels
          : []
      const allStories: Item[] = Array.isArray(storiesData.stories)
        ? storiesData.stories
        : Array.isArray(feedData.stories)
          ? feedData.stories
          : []

      const belongs = (item: Item) => {
        const itemUser = normalizeUsername(item.username || item.user || item.name)
        return itemUser === targetUsername
      }

      const userPosts = allPosts.filter(belongs)
      const userReels = allReels.filter(belongs)
      const userStories = allStories.filter(belongs)

      setPosts(userPosts)
      setReels(userReels)
      setStories(userStories)

      const realName =
        isOwn
          ? session.name
          : userPosts[0]?.name ||
            userReels[0]?.name ||
            userStories[0]?.name ||
            targetUsername.replace('@', '')

      setProfile({
        userId: session.userId,
        name: realName || 'Creator',
        username: targetUsername,
        bio: isOwn ? 'Digital Creator' : 'Creator profile',
        isOwn
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const activeItems = useMemo(() => {
    if (tab === 'reels') return reels
    if (tab === 'stories') return stories
    return posts
  }, [tab, posts, reels, stories])

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="" hideSearch>
        <section className="dynProfilePage">
          <header className="dynProfileTop">
            <div>
              <h1>Profile</h1>
              <p>Dynamic creator profile</p>
            </div>

            <div className="dynProfileTopBtns">
              <a href="/settings">⚙</a>
              <a href="/trash">🗑</a>
            </div>
          </header>

          <article className="dynProfileCard">
            <div className="dynCover" />

            <div className="dynProfileRow">
              <div className="dynAvatar">{firstLetter(profile.name)}</div>

              <div className="dynInfo">
                <h2>
                  {profile.name}
                  <span>✓</span>
                </h2>
                <b>{profile.username}</b>
                <p>{profile.bio}</p>
                <small>Verified Creator Profile</small>
              </div>
            </div>

            <div className="dynActions">
              {profile.isOwn ? (
                <>
                  <a href="/settings">Edit Profile</a>
                  <a href="/create">Create</a>
                  <a href="/trash">Trash</a>
                </>
              ) : (
                <>
                  <button type="button">Follow</button>
                  <button type="button">Message</button>
                  <button type="button">Share</button>
                </>
              )}
            </div>

            <div className="dynStats">
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
            </div>

            <div className="dynTabs">
              <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')} type="button">
                Posts
              </button>
              <button className={tab === 'reels' ? 'active' : ''} onClick={() => setTab('reels')} type="button">
                Reels
              </button>
              <button className={tab === 'stories' ? 'active' : ''} onClick={() => setTab('stories')} type="button">
                Stories
              </button>
            </div>
          </article>

          <section className="dynGrid">
            {loading && <div className="dynEmpty">Loading profile...</div>}

            {!loading && activeItems.map((item) => {
              const media = item.mediaUrl || item.videoUrl || ''
              const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl)

              return (
                <article className="dynPost" key={item.id}>
                  {validMedia(media) ? (
                    <div className="dynMedia">
                      {isVideo ? (
                        <video src={media} controls muted playsInline />
                      ) : (
                        <img src={media} alt={item.title || 'content'} />
                      )}
                    </div>
                  ) : (
                    <div className="dynFallback">{tab === 'reels' ? '▶' : tab === 'stories' ? '◉' : '✦'}</div>
                  )}

                  <div className="dynPostText">
                    <h3>{item.title || 'Creator Content'}</h3>
                    <p>{item.caption || 'Profile update'}</p>
                  </div>
                </article>
              )
            })}

            {!loading && activeItems.length === 0 && (
              <div className="dynEmpty">
                <b>No {tab} yet</b>
                <span>{profile.isOwn ? 'Create your first content.' : 'No content published yet.'}</span>
                {profile.isOwn && <a href="/create">Create now</a>}
              </div>
            )}
          </section>
        </section>
      </SocialAppShell>
    </AuthGuard>
  )
}
