'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type Item = {
  id: string
  kind: string
  title?: string
  caption?: string
  mediaUrl?: string
  videoUrl?: string
  mediaType?: string
  likes?: number
  comments?: number
}

type Profile = {
  name: string
  username: string
  bio: string
  location?: string
  avatarUrl?: string
  coverUrl?: string
  verified?: boolean
  followers: number
  following: number
  isFollowing: boolean
  isOwner: boolean
  counts: { posts: number; reels: number; stories: number }
}

function cleanUsername(v?: string | null) {
  const t = String(v || '').trim()
  return t ? (t.startsWith('@') ? t : `@${t}`) : '@creator'
}

function firstLetter(v?: string) {
  return String(v || 'U').replace('@', '').slice(0, 1).toUpperCase()
}

function goodUrl(v?: string) {
  const t = String(v || '').trim()
  return t.startsWith('http') || t.startsWith('/media/') || t.startsWith('data:')
}

function count(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
  return String(v || 0)
}

export default function ProfileClient() {
  const params = useSearchParams()

  const [viewer, setViewer] = useState('@guest')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Item[]>([])
  const [reels, setReels] = useState<Item[]>([])
  const [stories, setStories] = useState<Item[]>([])
  const [tab, setTab] = useState<'posts' | 'reels' | 'stories'>('posts')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const username = useMemo(() => cleanUsername(params.get('username') || viewer), [params, viewer])

  async function loadProfile() {
    setLoading(true)
    setNotice('')

    const session = await getSessionUser()
    const currentUser = cleanUsername(session.username || '@guest')
    setViewer(currentUser)

    const target = cleanUsername(params.get('username') || currentUser)

    const data = await fetch(
      `/api/profile/full?username=${encodeURIComponent(target)}&viewer=${encodeURIComponent(currentUser)}`,
      { cache: 'no-store' }
    )
      .then((r) => r.json())
      .catch(() => ({ success: false, message: 'Profile backend failed.' }))

    if (!data.success || !data.profile) {
      setProfile(null)
      setPosts([])
      setReels([])
      setStories([])
      setNotice(data.message || 'Profile not found.')
      setLoading(false)
      return
    }

    setProfile(data.profile)
    setPosts(Array.isArray(data.posts) ? data.posts : [])
    setReels(Array.isArray(data.reels) ? data.reels : [])
    setStories(Array.isArray(data.stories) ? data.stories : [])
    setLoading(false)
  }

  useEffect(() => {
    loadProfile()
  }, [params])

  async function toggleFollow() {
    if (!profile || profile.isOwner || busy) return

    setBusy(true)

    const data = await fetch('/api/follow/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower: viewer, following: profile.username }),
    })
      .then((r) => r.json())
      .catch(() => ({ success: false, message: 'Follow failed.' }))

    setNotice(data.message || 'Updated.')

    if (data.success) {
      setProfile((old) =>
        old
          ? {
              ...old,
              isFollowing: Boolean(data.isFollowing),
              followers: Number(data.followers ?? old.followers),
            }
          : old
      )
    }

    setBusy(false)
  }

  const activeItems = tab === 'posts' ? posts : tab === 'reels' ? reels : stories

  return (
    <AuthGuard>
      <SocialAppShell active="profile" hideSearch>
        <main className="dynProfilePage">
          {loading ? (
            <section className="dynProfileState">Loading profile...</section>
          ) : !profile ? (
            <section className="dynProfileState">
              <b>Profile not found</b>
              <span>{notice}</span>
            </section>
          ) : (
            <>
              <section className="dynProfileHero">
                <div className="dynProfileCover">
                  {goodUrl(profile.coverUrl) ? <img src={profile.coverUrl} alt="cover" /> : <span />}
                </div>

                <div className="dynProfileTop">
                  <div className="dynProfileAvatar">
                    {goodUrl(profile.avatarUrl) ? <img src={profile.avatarUrl} alt={profile.name} /> : <b>{firstLetter(profile.name)}</b>}
                    <i />
                  </div>

                  <div className="dynProfileIdentity">
                    <h1>
                      {profile.name}
                      {profile.verified && <em>✓</em>}
                    </h1>
                    <strong>{profile.username}</strong>
                    <p>{profile.bio || 'Digital Creator'}</p>
                    <small>📍 {profile.location || 'India'}</small>
                  </div>
                </div>

                <div className="dynProfileStats">
                  <div><b>{count(profile.counts.posts)}</b><span>Posts</span></div>
                  <div><b>{count(profile.counts.reels)}</b><span>Reels</span></div>
                  <div><b>{count(profile.followers)}</b><span>Followers</span></div>
                  <div><b>{count(profile.following)}</b><span>Following</span></div>
                </div>

                <div className="dynProfileActions">
                  {profile.isOwner ? (
                    <>
                      <a href="/settings">Edit Profile</a>
                      <a href="/create">Create</a>
                      <a href="/trash">Trash</a>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={toggleFollow} disabled={busy} className={profile.isFollowing ? 'active' : ''}>
                        {profile.isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <a href={`/messages?to=${encodeURIComponent(profile.username)}`}>Message</a>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/profile?username=${profile.username}`)}>
                        Share
                      </button>
                    </>
                  )}
                </div>

                {notice && <div className="dynProfileNotice">{notice}</div>}
              </section>

              <section className="dynProfileTabs">
                <button type="button" onClick={() => setTab('posts')} className={tab === 'posts' ? 'active' : ''}>Posts</button>
                <button type="button" onClick={() => setTab('reels')} className={tab === 'reels' ? 'active' : ''}>Reels</button>
                <button type="button" onClick={() => setTab('stories')} className={tab === 'stories' ? 'active' : ''}>Stories</button>
              </section>

              <section className="dynProfileGrid">
                {activeItems.length === 0 ? (
                  <div className="dynProfileEmpty">
                    <b>No {tab} yet</b>
                    <span>{profile.isOwner ? 'Create your first content.' : `${profile.name} has not added ${tab} yet.`}</span>
                    {profile.isOwner && <a href="/create">Create now</a>}
                  </div>
                ) : (
                  activeItems.map((item) => {
                    const src = item.videoUrl || item.mediaUrl || ''
                    const isVideo = item.kind === 'reel' || item.mediaType === 'video'

                    return (
                      <a className="dynProfileCard" href={`/post/${encodeURIComponent(item.id)}`} key={item.id}>
                        <div className="dynProfileMedia">
                          {goodUrl(src) ? (
                            isVideo ? <video src={src} muted playsInline preload="metadata" /> : <img src={src} alt={item.title || 'content'} />
                          ) : (
                            <span>{isVideo ? '▶' : '✦'}</span>
                          )}
                        </div>
                        <div className="dynProfileCardText">
                          <b>{item.title || item.kind}</b>
                          <small>♥ {count(Number(item.likes || 0))} · 💬 {count(Number(item.comments || 0))}</small>
                        </div>
                      </a>
                    )
                  })
                )}
              </section>
            </>
          )}
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
