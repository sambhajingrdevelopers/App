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
  likes?: number | string
  comments?: number | string
  views?: number | string
}

type ProfileUser = {
  name: string
  username: string
  bio: string
  avatarUrl: string
  bannerUrl: string
  verified: boolean
  followers: number | null
  following: number | null
  isOwner: boolean
  isPrivate: boolean
  allowMessages: boolean
}

function normalizeUsername(value?: string | null) {
  const clean = String(value || '').trim()
  if (!clean) return '@you'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

function isMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:')
}

function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Private'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileUser>({
    name: 'Creator',
    username: '@you',
    bio: 'Digital Creator',
    avatarUrl: '',
    bannerUrl: '',
    verified: true,
    followers: 0,
    following: 0,
    isOwner: true,
    isPrivate: false,
    allowMessages: true
  })

  const [posts, setPosts] = useState<ContentItem[]>([])
  const [reels, setReels] = useState<ContentItem[]>([])
  const [stories, setStories] = useState<ContentItem[]>([])
  const [tab, setTab] = useState<'posts' | 'reels' | 'stories' | 'tagged'>('posts')
  const [loading, setLoading] = useState(true)

  async function loadProfile() {
    setLoading(true)

    try {
      const session = await getSessionUser()
      const params = new URLSearchParams(window.location.search)
      const targetUsername = normalizeUsername(params.get('username') || session.username)

      const data = await fetch(
        `/api/profile?username=${encodeURIComponent(targetUsername)}&viewer=${encodeURIComponent(session.username)}`,
        { cache: 'no-store' }
      ).then((res) => res.json())

      const user = data.user || {}

      setProfile({
        name: user.name || targetUsername.replace('@', '') || 'Creator',
        username: normalizeUsername(user.username || targetUsername),
        bio: user.bio || 'Digital Creator',
        avatarUrl: user.avatarUrl || '',
        bannerUrl: user.bannerUrl || '',
        verified: user.verified !== false,
        followers: user.followers ?? 0,
        following: user.following ?? 0,
        isOwner: Boolean(user.isOwner),
        isPrivate: Boolean(user.isPrivate),
        allowMessages: user.allowMessages !== false
      })

      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setReels(Array.isArray(data.reels) ? data.reels : [])
      setStories(Array.isArray(data.stories) ? data.stories : [])
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
    if (tab === 'tagged') return []
    return posts
  }, [tab, posts, reels, stories])

  const likes = posts.reduce((sum, item) => sum + Number(item.likes || 0), 0)

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="" hideSearch>
        <main className="publicOwnerProfile">
          <header className="poProfileHeader">
            <a className="poRoundBtn" href="/home">‹</a>

            <div>
              <h1>{profile.isOwner ? 'My Profile' : 'Profile'}</h1>
              <p>{profile.isOwner ? 'Owner account' : 'Public creator profile'}</p>
            </div>

            <div className="poHeaderActions">
              {profile.isOwner ? (
                <>
                  <a href="/settings">⚙</a>
                  <a href="/trash">🗑</a>
                </>
              ) : (
                <>
                  <button type="button">↗</button>
                  <button type="button">⋯</button>
                </>
              )}
            </div>
          </header>

          <section className="poProfileCard">
            <div className="poCover">
              {isMedia(profile.bannerUrl) ? <img src={profile.bannerUrl} alt="Profile banner" /> : <span />}
            </div>

            <div className="poIdentity">
              <div className="poAvatar">
                {isMedia(profile.avatarUrl) ? (
                  <img src={profile.avatarUrl} alt={profile.name} />
                ) : (
                  <b>{firstLetter(profile.name)}</b>
                )}
                <i />
              </div>

              <div className="poNameBox">
                <h2>
                  {profile.name}
                  {profile.verified && <em>✓</em>}
                </h2>
                <strong>{profile.username}</strong>
                <p>{profile.bio}</p>
                <small>📍 India · Joined 2026</small>
              </div>
            </div>

            <p className="poBio">
              {profile.isPrivate && !profile.isOwner
                ? 'This creator has a private profile.'
                : 'Creating digital experiences that inspire and connect. Design. Code. Create.'}
            </p>

            <div className="poStats">
              <div>
                <b>{posts.length}</b>
                <span>Posts</span>
              </div>
              <div>
                <b>{formatCount(profile.followers)}</b>
                <span>Followers</span>
              </div>
              <div>
                <b>{formatCount(profile.following)}</b>
                <span>Following</span>
              </div>
              <div>
                <b>{reels.length}</b>
                <span>Reels</span>
              </div>
            </div>

            <div className="poActions">
              {profile.isOwner ? (
                <>
                  <a href="/settings">Edit Profile</a>
                  <a href="/create">Create</a>
                  <a href="/trash">Trash</a>
                </>
              ) : (
                <>
                  <button type="button">Follow</button>
                  {profile.allowMessages && <button type="button">Message</button>}
                  <button type="button">Share</button>
                </>
              )}
            </div>

            <div className="poHighlights">
              {profile.isOwner && (
                <a href="/create">
                  <span>+</span>
                  <b>New</b>
                </a>
              )}

              {['Design', 'Code', 'Work', 'Travel', 'Life'].map((item) => (
                <button type="button" key={item}>
                  <span>{item.slice(0, 1)}</span>
                  <b>{item}</b>
                </button>
              ))}
            </div>

            <div className="poTabs">
              <button type="button" className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>
                ▦ Posts
              </button>
              <button type="button" className={tab === 'reels' ? 'active' : ''} onClick={() => setTab('reels')}>
                ▣ Reels
              </button>
              <button type="button" className={tab === 'stories' ? 'active' : ''} onClick={() => setTab('stories')}>
                ◉ Stories
              </button>
              <button type="button" className={tab === 'tagged' ? 'active' : ''} onClick={() => setTab('tagged')}>
                ♡ Tagged
              </button>
            </div>
          </section>

          <section className="poGrid">
            {loading && <div className="poEmpty">Loading profile...</div>}

            {!loading && profile.isPrivate && !profile.isOwner && (
              <div className="poEmpty">
                <b>Private profile</b>
                <span>Follow this creator to see posts, reels and stories.</span>
              </div>
            )}

            {!loading &&
              !(profile.isPrivate && !profile.isOwner) &&
              activeItems.map((item) => {
                const src = item.mediaUrl || item.videoUrl || ''
                const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl)

                return (
                  <article className="poPost" key={item.id}>
                    <a href={`/post/${encodeURIComponent(item.id)}`} className="poPostMedia">
                      {isMedia(src) ? (
                        isVideo ? (
                          <video src={src} muted playsInline />
                        ) : (
                          <img src={src} alt={item.title || 'Profile content'} />
                        )
                      ) : (
                        <span>{tab === 'reels' ? '▶' : tab === 'stories' ? '◉' : '✦'}</span>
                      )}
                    </a>

                    <div className="poPostText">
                      <h3>{item.title || 'Creator Content'}</h3>
                      <p>{item.caption || 'Profile update'}</p>
                    </div>
                  </article>
                )
              })}

            {!loading &&
              !(profile.isPrivate && !profile.isOwner) &&
              activeItems.length === 0 && (
                <div className="poEmpty">
                  <b>No {tab} yet</b>
                  <span>{profile.isOwner ? 'Create your first content.' : 'This creator has not published here yet.'}</span>
                  {profile.isOwner && <a href="/create">Create now</a>}
                </div>
              )}
          </section>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
