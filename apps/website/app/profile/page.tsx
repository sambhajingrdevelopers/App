'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type ProfileUser = {
  id?: string
  name: string
  username: string
  bio: string
  avatarUrl?: string
  bannerUrl?: string
  verified?: boolean
  followers?: number
  following?: number
  isPrivate?: boolean
  allowMessages?: boolean
  isOwner?: boolean
}

type ContentItem = {
  id: string
  kind: string
  type: string
  title?: string
  caption?: string
  mediaUrl?: string
  videoUrl?: string
  mediaType?: string
  likes?: number
  comments?: number
  views?: number
  createdAt?: string
}

type Tab = 'posts' | 'reels' | 'stories'

function cleanUsername(value?: string | null) {
  const clean = String(value || '').trim()
  if (!clean) return '@you'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').replace('@', '').trim().slice(0, 1).toUpperCase()
}

function validMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

function compact(value?: number) {
  const n = Number(value || 0)
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function Media({ item }: { item: ContentItem }) {
  const src = item.videoUrl || item.mediaUrl || ''
  const isVideo = item.mediaType === 'video' || item.kind === 'reel' || Boolean(item.videoUrl)

  if (!validMedia(src)) {
    return (
      <div className="vlxFinalProfileFallback">
        <b>{isVideo ? '▶' : '✦'}</b>
      </div>
    )
  }

  if (isVideo) {
    return <video src={src} muted playsInline preload="metadata" />
  }

  return <img src={src} alt={item.title || item.kind} />
}

export default function ProfilePage() {
  const [viewer, setViewer] = useState('@guest')
  const [profile, setProfile] = useState<ProfileUser>({
    name: 'Creator',
    username: '@you',
    bio: 'Digital Creator',
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
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  async function loadProfile() {
    setLoading(true)
    setNotice('')

    try {
      const session = await getSessionUser()
      const viewerUsername = cleanUsername(session.username)
      setViewer(viewerUsername)

      const params = new URLSearchParams(window.location.search)
      const target = cleanUsername(params.get('username') || viewerUsername)

      const data = await fetch(
        `/api/profile/final?username=${encodeURIComponent(target)}&viewer=${encodeURIComponent(viewerUsername)}`,
        { cache: 'no-store' }
      ).then((res) => res.json())

      if (!data.success || !data.user) {
        throw new Error(data.message || 'Profile load failed.')
      }

      setProfile(data.user)
      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setReels(Array.isArray(data.reels) ? data.reels : [])
      setStories(Array.isArray(data.stories) ? data.stories : [])

      if (!data.user.isOwner) {
        const followData = await fetch(
          `/api/follow/status?follower=${encodeURIComponent(viewerUsername)}&following=${encodeURIComponent(target)}`,
          { cache: 'no-store' }
        ).then((res) => res.json()).catch(() => ({}))

        setIsFollowing(Boolean(followData.isFollowing))

        if (typeof followData.followers === 'number') {
          setProfile((old) => ({ ...old, followers: followData.followers }))
        }
      }
    } catch (error: any) {
      setNotice(error?.message || 'Profile load failed.')
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

    const data = await fetch('/api/follow/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower: viewer, following: profile.username })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Follow failed.'
    }))

    setNotice(data.message || 'Updated.')

    if (data.success) {
      setIsFollowing(Boolean(data.isFollowing))
      if (typeof data.followers === 'number') {
        setProfile((old) => ({ ...old, followers: data.followers }))
      }
    }
  }

  async function saveItem(item: ContentItem) {
    const data = await fetch('/api/saved/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: viewer, contentId: item.id, kind: item.kind })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Save failed.'
    }))

    setNotice(data.message || 'Updated.')
  }

  async function trashItem(item: ContentItem) {
    const data = await fetch('/api/trash/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: viewer, contentId: item.id })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Move to trash failed.'
    }))

    setNotice(data.message || 'Updated.')

    if (data.success) {
      setPosts((old) => old.filter((x) => x.id !== item.id))
      setReels((old) => old.filter((x) => x.id !== item.id))
      setStories((old) => old.filter((x) => x.id !== item.id))
    }
  }

  const canViewContent = profile.isOwner || !profile.isPrivate

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="" hideSearch>
        <main className="vlxFinalProfilePage">
          {loading ? (
            <section className="vlxFinalProfileState">Loading profile...</section>
          ) : (
            <>
              <section className="vlxFinalProfileHero">
                <div className="vlxFinalProfileCover">
                  {validMedia(profile.bannerUrl) ? <img src={profile.bannerUrl} alt="Cover" /> : <span />}
                </div>

                <div className="vlxFinalProfileMain">
                  <div className="vlxFinalProfileAvatar">
                    {validMedia(profile.avatarUrl) ? (
                      <img src={profile.avatarUrl} alt={profile.name} />
                    ) : (
                      <b>{firstLetter(profile.name)}</b>
                    )}
                    <i />
                  </div>

                  <div className="vlxFinalProfileInfo">
                    <h1>
                      {profile.name}
                      {profile.verified && <em>✓</em>}
                    </h1>
                    <p>{profile.username}</p>
                    <small>{profile.bio}</small>
                  </div>
                </div>

                <div className="vlxFinalProfileStats">
                  <div><b>{posts.length}</b><span>Posts</span></div>
                  <div><b>{reels.length}</b><span>Reels</span></div>
                  <div><b>{compact(profile.followers)}</b><span>Followers</span></div>
                  <div><b>{compact(profile.following)}</b><span>Following</span></div>
                </div>

                <div className="vlxFinalProfileActions">
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
                        <a href={`/messages?to=${encodeURIComponent(profile.username)}`}>Message</a>
                      )}
                      <a href={`/search?q=${encodeURIComponent(profile.username)}`}>Search</a>
                    </>
                  )}
                </div>

                {profile.isPrivate && !profile.isOwner && (
                  <div className="vlxFinalProfilePrivate">
                    Private profile. Follow request or owner permission is required.
                  </div>
                )}

                {notice && <div className="vlxFinalProfileNotice">{notice}</div>}
              </section>

              <section className="vlxFinalProfileTabs">
                <button type="button" className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>
                  Posts
                </button>
                <button type="button" className={tab === 'reels' ? 'active' : ''} onClick={() => setTab('reels')}>
                  Reels
                </button>
                <button type="button" className={tab === 'stories' ? 'active' : ''} onClick={() => setTab('stories')}>
                  Stories
                </button>
              </section>

              {!canViewContent ? (
                <section className="vlxFinalProfileState">
                  <b>Private profile</b>
                  <span>Content is hidden by privacy settings.</span>
                </section>
              ) : activeItems.length === 0 ? (
                <section className="vlxFinalProfileState">
                  <b>No {tab} yet</b>
                  <span>{profile.isOwner ? 'Create your first content.' : 'This creator has no content here.'}</span>
                  {profile.isOwner && <a href="/create">Create now</a>}
                </section>
              ) : (
                <section className="vlxFinalProfileGrid">
                  {activeItems.map((item) => (
                    <article className="vlxFinalProfilePost" key={item.id}>
                      <a href={`/post/${encodeURIComponent(item.id)}`}>
                        <Media item={item} />
                        <span>{item.kind}</span>
                      </a>

                      <div>
                        <h2>{item.title || item.kind}</h2>
                        <p>{item.caption || 'Backend connected content.'}</p>
                        <small>♡ {item.likes || 0} · �� {item.comments || 0} · ▶ {item.views || 0}</small>

                        <div>
                          <a href={`/post/${encodeURIComponent(item.id)}`}>Open</a>
                          <button type="button" onClick={() => saveItem(item)}>Save</button>
                          {profile.isOwner && (
                            <button type="button" onClick={() => trashItem(item)}>Trash</button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
