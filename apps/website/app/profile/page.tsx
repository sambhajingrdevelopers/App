'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type ContentItem = {
  id: string
  kind: string
  title: string
  caption?: string
  username: string
  name?: string
  mediaUrl?: string
  videoUrl?: string
  mediaType?: string
  likes?: number
  comments?: number
  views?: number
  createdAt?: string
}

type ProfileData = {
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
  counts: {
    posts: number
    reels: number
    stories: number
  }
}

function cleanUsername(value?: string | null) {
  const text = String(value || '').trim()
  if (!text) return '@creator'
  return text.startsWith('@') ? text : `@${text}`
}

function firstLetter(value?: string) {
  return String(value || 'U').replace('@', '').slice(0, 1).toUpperCase()
}

function validUrl(value?: string) {
  const clean = String(value || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

function formatCount(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value || 0)
}

function mediaSrc(item: ContentItem) {
  return item.videoUrl || item.mediaUrl || ''
}

function ProfileContentCard({ item }: { item: ContentItem }) {
  const src = mediaSrc(item)
  const isVideo = item.kind === 'reel' || item.mediaType === 'video'

  return (
    <a className="dynProfileCard" href={`/post/${encodeURIComponent(item.id)}`}>
      <div className="dynProfileMedia">
        {validUrl(src) ? (
          isVideo ? (
            <video src={src} muted playsInline preload="metadata" />
          ) : (
            <img src={src} alt={item.title} />
          )
        ) : (
          <span>{isVideo ? '▶' : '✦'}</span>
        )}
      </div>

      <div className="dynProfileCardText">
        <b>{item.title}</b>
        <small>♥ {formatCount(Number(item.likes || 0))} · 💬 {formatCount(Number(item.comments || 0))}</small>
      </div>
    </a>
  )
}

export default function DynamicProfilePage() {
  const searchParams = useSearchParams()

  const [viewer, setViewer] = useState('@guest')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<ContentItem[]>([])
  const [reels, setReels] = useState<ContentItem[]>([])
  const [stories, setStories] = useState<ContentItem[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'stories'>('posts')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const targetUsername = useMemo(() => {
    return cleanUsername(searchParams.get('username') || viewer)
  }, [searchParams, viewer])

  async function loadProfile() {
    setLoading(true)
    setNotice('')

    const session = await getSessionUser()
    const currentViewer = cleanUsername(session.username || '@guest')
    setViewer(currentViewer)

    const target = cleanUsername(searchParams.get('username') || currentViewer)

    const data = await fetch(
      `/api/profile/full?username=${encodeURIComponent(target)}&viewer=${encodeURIComponent(currentViewer)}`,
      { cache: 'no-store' }
    )
      .then((res) => res.json())
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
  }, [searchParams])

  async function toggleFollow() {
    if (!profile || profile.isOwner || busy) return

    setBusy(true)

    const data = await fetch('/api/follow/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower: viewer, following: profile.username }),
    })
      .then((res) => res.json())
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

  const activeItems = activeTab === 'posts' ? posts : activeTab === 'reels' ? reels : stories

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
                  {validUrl(profile.coverUrl) ? <img src={profile.coverUrl} alt="cover" /> : <span />}
                </div>

                <div className="dynProfileTop">
                  <div className="dynProfileAvatar">
                    {validUrl(profile.avatarUrl) ? (
                      <img src={profile.avatarUrl} alt={profile.name} />
                    ) : (
                      <b>{firstLetter(profile.name)}</b>
                    )}
                    <i />
                  </div>

                  <div className="dynProfileIdentity">
                    <h1>
                      {profile.name}
                      {profile.verified && <em>✓</em>}
                    </h1>
                    <strong>{profile.username}</strong>
                    <p>{profile.bio}</p>
                    <small>📍 {profile.location || 'India'}</small>
                  </div>
                </div>

                <div className="dynProfileStats">
                  <div>
                    <b>{formatCount(profile.counts.posts)}</b>
                    <span>Posts</span>
                  </div>
                  <div>
                    <b>{formatCount(profile.counts.reels)}</b>
                    <span>Reels</span>
                  </div>
                  <div>
                    <b>{formatCount(profile.followers)}</b>
                    <span>Followers</span>
                  </div>
                  <div>
                    <b>{formatCount(profile.following)}</b>
                    <span>Following</span>
                  </div>
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
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/profile?username=${profile.username}`)}
                      >
                        Share
                      </button>
                    </>
                  )}
                </div>

                {notice && <div className="dynProfileNotice">{notice}</div>}
              </section>

              <section className="dynProfileTabs">
                <button type="button" onClick={() => setActiveTab('posts')} className={activeTab === 'posts' ? 'active' : ''}>
                  Posts
                </button>
                <button type="button" onClick={() => setActiveTab('reels')} className={activeTab === 'reels' ? 'active' : ''}>
                  Reels
                </button>
                <button type="button" onClick={() => setActiveTab('stories')} className={activeTab === 'stories' ? 'active' : ''}>
                  Stories
                </button>
              </section>

              <section className="dynProfileGrid">
                {activeItems.length === 0 ? (
                  <div className="dynProfileEmpty">
                    <b>No {activeTab} yet</b>
                    <span>
                      {profile.isOwner ? 'Create your first content.' : `${profile.name} has not added ${activeTab} yet.`}
                    </span>
                    {profile.isOwner && <a href="/create">Create now</a>}
                  </div>
                ) : (
                  activeItems.map((item) => <ProfileContentCard key={item.id} item={item} />)
                )}
              </section>
            </>
          )}
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
