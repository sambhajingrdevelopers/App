'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

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
  comments?: number | string
  views?: number | string
  createdAt?: string
}

type Tab = 'posts' | 'reels' | 'stories'

function cleanUsername(value?: string | null) {
  const clean = String(value || '').trim()
  if (!clean) return '@you'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

function validMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

function count(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Private'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

function ProfileMedia({ item, tab }: { item: ContentItem; tab: Tab }) {
  const src = item.videoUrl || item.mediaUrl || ''
  const isVideo =
    item.mediaType === 'video' ||
    item.kind === 'reel' ||
    item.type === 'reel' ||
    Boolean(item.videoUrl)

  if (!validMedia(src)) {
    return (
      <div className="vlxProfileFallback">
        <span>{tab === 'reels' ? '▶' : tab === 'stories' ? '◉' : '✦'}</span>
      </div>
    )
  }

  if (isVideo) {
    return <video src={src} muted playsInline preload="metadata" />
  }

  return <img src={src} alt={item.title || 'profile content'} />
}

export default function ProfilePage() {
  const [viewerUsername, setViewerUsername] = useState('@guest')
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
  const [tab, setTab] = useState<Tab>('posts')
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [message, setMessage] = useState('')

  async function loadProfile() {
    setLoading(true)
    setMessage('')

    try {
      const session = await getSessionUser()
      setViewerUsername(session.username)

      const params = new URLSearchParams(window.location.search)
      const target = cleanUsername(params.get('username') || session.username)

      const data = await fetch(
        `/api/profile?username=${encodeURIComponent(target)}&viewer=${encodeURIComponent(session.username)}`,
        { cache: 'no-store' }
      ).then((res) => res.json())

      const user = data.user || {}

      const nextProfile: ProfileUser = {
        name: user.name || target.replace('@', '') || 'Creator',
        username: cleanUsername(user.username || target),
        bio: user.bio || 'Digital Creator',
        avatarUrl: user.avatarUrl || '',
        bannerUrl: user.bannerUrl || '',
        verified: user.verified !== false,
        followers: user.followers ?? 0,
        following: user.following ?? 0,
        isOwner: Boolean(user.isOwner),
        isPrivate: Boolean(user.isPrivate),
        allowMessages: user.allowMessages !== false
      }

      setProfile(nextProfile)
      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setReels(Array.isArray(data.reels) ? data.reels : [])
      setStories(Array.isArray(data.stories) ? data.stories : [])

      if (!nextProfile.isOwner) {
        const followData = await fetch(
          `/api/follow/status?follower=${encodeURIComponent(session.username)}&following=${encodeURIComponent(nextProfile.username)}`,
          { cache: 'no-store' }
        ).then((res) => res.json()).catch(() => ({}))

        setIsFollowing(Boolean(followData.isFollowing))

        setProfile((old) => ({
          ...old,
          followers: followData.followers ?? old.followers,
          following: followData.following ?? old.following
        }))
      }
    } catch {
      setMessage('Profile load failed.')
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

  async function handleFollow() {
    if (profile.isOwner) return

    setMessage('Updating follow...')

    const data = await fetch('/api/follow/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        follower: viewerUsername,
        following: profile.username
      })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Follow failed.'
    }))

    if (data.success) {
      setIsFollowing(Boolean(data.isFollowing))
      setProfile((old) => ({
        ...old,
        followers: data.followers ?? old.followers,
        following: data.following ?? old.following
      }))
    }

    setMessage(data.message || 'Updated.')
  }

  function handleMessage() {
    window.location.href = `/messages?to=${encodeURIComponent(profile.username)}`
  }

  async function handleShare() {
    const url = `${window.location.origin}/profile?username=${encodeURIComponent(profile.username)}`

    if (navigator.share) {
      await navigator.share({
        title: `${profile.name} profile`,
        text: `View ${profile.name}'s profile`,
        url
      })
      return
    }

    await navigator.clipboard.writeText(url)
    setMessage('Profile link copied.')
  }

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="" hideSearch>
        <main className="vlxProfilePage">
          <header className="vlxProfileHeader">
            <a href="/home">‹</a>

            <div>
              <h1>{profile.isOwner ? 'My Profile' : 'Profile'}</h1>
              <p>{profile.isOwner ? 'Owner profile' : 'Public creator profile'}</p>
            </div>

            <div>
              {profile.isOwner ? (
                <>
                  <a href="/settings">⚙</a>
                  <a href="/trash">🗑</a>
                </>
              ) : (
                <>
                  <button type="button" onClick={handleShare}>↗</button>
                  <button type="button">⋯</button>
                </>
              )}
            </div>
          </header>

          {loading && (
            <section className="vlxProfileState">
              Loading profile...
            </section>
          )}

          {!loading && (
            <>
              <section className="vlxProfileCard">
                <div className="vlxProfileCover">
                  {validMedia(profile.bannerUrl) ? (
                    <img src={profile.bannerUrl} alt="Profile banner" />
                  ) : (
                    <span />
                  )}
                </div>

                <div className="vlxProfileIdentity">
                  <div className="vlxProfileAvatar">
                    {validMedia(profile.avatarUrl) ? (
                      <img src={profile.avatarUrl} alt={profile.name} />
                    ) : (
                      <b>{firstLetter(profile.name)}</b>
                    )}
                    <i />
                  </div>

                  <div className="vlxProfileInfo">
                    <h2>
                      {profile.name}
                      {profile.verified && <em>✓</em>}
                    </h2>
                    <strong>{profile.username}</strong>
                    <p>{profile.bio}</p>
                    <small>📍 India · Creator account</small>
                  </div>
                </div>

                <p className="vlxProfileBio">
                  {profile.isPrivate && !profile.isOwner
                    ? 'This creator has a private profile.'
                    : 'Creating digital experiences that inspire and connect.'}
                </p>

                <div className="vlxProfileStats">
                  <div><b>{posts.length}</b><span>Posts</span></div>
                  <div><b>{count(profile.followers)}</b><span>Followers</span></div>
                  <div><b>{count(profile.following)}</b><span>Following</span></div>
                  <div><b>{reels.length}</b><span>Reels</span></div>
                </div>

                <div className="vlxProfileActions">
                  {profile.isOwner ? (
                    <>
                      <a href="/settings">Edit Profile</a>
                      <a href="/create">Create</a>
                      <a href="/trash">Trash</a>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={handleFollow}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      {profile.allowMessages && (
                        <button type="button" onClick={handleMessage}>
                          Message
                        </button>
                      )}
                      <button type="button" onClick={handleShare}>
                        Share
                      </button>
                    </>
                  )}
                </div>

                {message && <div className="vlxProfileMessage">{message}</div>}

                <div className="vlxProfileTabs">
                  <button type="button" onClick={() => setTab('posts')} className={tab === 'posts' ? 'active' : ''}>
                    Posts
                  </button>
                  <button type="button" onClick={() => setTab('reels')} className={tab === 'reels' ? 'active' : ''}>
                    Reels
                  </button>
                  <button type="button" onClick={() => setTab('stories')} className={tab === 'stories' ? 'active' : ''}>
                    Stories
                  </button>
                </div>
              </section>

              <section className="vlxProfileGrid">
                {profile.isPrivate && !profile.isOwner ? (
                  <div className="vlxProfileState">
                    <b>Private profile</b>
                    <span>Follow this creator to see posts and reels.</span>
                  </div>
                ) : activeItems.length === 0 ? (
                  <div className="vlxProfileState">
                    <b>No {tab} yet</b>
                    <span>{profile.isOwner ? 'Create your first content.' : 'This creator has not posted yet.'}</span>
                    {profile.isOwner && <a href="/create">Create now</a>}
                  </div>
                ) : (
                  activeItems.map((item) => (
                    <a href={`/post/${encodeURIComponent(item.id)}`} className="vlxProfilePost" key={item.id}>
                      <div>
                        <ProfileMedia item={item} tab={tab} />
                        {tab === 'reels' && <em>▶</em>}
                      </div>
                      <h3>{item.title || tab}</h3>
                      <p>{item.caption || 'Profile content'}</p>
                    </a>
                  ))
                )}
              </section>
            </>
          )}
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
