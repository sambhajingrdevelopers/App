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

function normalizeUsername(value?: string | null) {
  const clean = String(value || '').trim()
  if (!clean) return '@you'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
}

function mediaOk(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:')
}

export default function ProfilePage() {
  const [user, setUser] = useState({
    userId: 'USR-YOU',
    name: 'Creator',
    username: '@you',
    bio: 'Digital Creator • Designer • Developer',
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
      const params = new URLSearchParams(window.location.search)
      const target = params.get('username') || ''

      const data = await fetch(`/api/profile${target ? `?username=${encodeURIComponent(target)}` : ''}`, {
        cache: 'no-store'
      }).then((r) => r.json())

      const profileUser = data.user || {}
      const counts = data.counts || {}

      setUser({
        userId: profileUser.username || 'USR-YOU',
        name: profileUser.name || 'Creator',
        username: profileUser.username || '@you',
        bio: profileUser.bio || 'Digital Creator • Designer • Developer',
        isOwn: Boolean(profileUser.isOwner)
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
    return posts
  }, [tab, posts, reels, stories])

  const totalLikes = posts.reduce((sum, item) => sum + Number(item.likes || 0), 0)

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="" hideSearch>
        <main className="realProfilePage">
          <header className="realProfileHeader">
            <a href="/home" className="realProfileIcon">‹</a>
            <div>
              <h1>Profile</h1>
              <p>Creator account</p>
            </div>
            <div className="realProfileHeaderActions">
              <a href="/settings">⚙</a>
              <a href="/trash">🗑</a>
            </div>
          </header>

          <section className="realProfileCard">
            <div className="realCover">
              <div className="realCoverDots"><span /><span /></div>
            </div>

            <div className="realIdentity">
              <div className="realAvatar">
                <span>{firstLetter(user.name)}</span>
                <i />
              </div>

              <div className="realNameBlock">
                <h2>{user.name}<b>✓</b></h2>
                <strong>{user.username}</strong>
                <p>{user.bio}</p>
                <small>📍 India · Joined 2026</small>
              </div>
            </div>

            <p className="realBio">
              Creating digital experiences that inspire and connect. Design. Code. Create.
            </p>

            <div className="realStats">
              <div><b>{posts.length}</b><span>Posts</span></div>
              <div><b>{reels.length}</b><span>Reels</span></div>
              <div><b>{stories.length}</b><span>Stories</span></div>
              <div><b>{totalLikes}</b><span>Likes</span></div>
            </div>

            <div className="realActions">
              {user.isOwn ? (
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

            <div className="realHighlights">
              {['Travel ✈️', 'Design 🎨', 'Life ✨', 'BTS 🎬', 'More +'].map((item) => (
                <div key={item}>
                  <span>{item.split(' ')[0].slice(0, 1)}</span>
                  <b>{item}</b>
                </div>
              ))}
            </div>

            <div className="realTabs">
              <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')} type="button">▦ Posts</button>
              <button className={tab === 'reels' ? 'active' : ''} onClick={() => setTab('reels')} type="button">▣ Reels</button>
              <button className={tab === 'stories' ? 'active' : ''} onClick={() => setTab('stories')} type="button">◉ Stories</button>
            </div>
          </section>

          <section className="realContentGrid">
            {loading && <div className="realEmpty">Loading profile...</div>}

            {!loading && activeItems.map((item) => {
              const src = item.mediaUrl || item.videoUrl || ''
              const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl)

              return (
                <article className="realPostCard" key={item.id}>
                  <div className="realPostMedia">
                    {mediaOk(src) ? (
                      isVideo ? <video src={src} muted playsInline controls /> : <img src={src} alt={item.title || 'post'} />
                    ) : (
                      <span>{tab === 'reels' ? '▶' : tab === 'stories' ? '◉' : '✦'}</span>
                    )}
                  </div>
                  <div className="realPostText">
                    <h3>{item.title || 'Creator Content'}</h3>
                    <p>{item.caption || 'Profile update'}</p>
                  </div>
                </article>
              )
            })}

            {!loading && activeItems.length === 0 && (
              <div className="realEmpty">
                <b>No {tab} yet</b>
                <span>{user.isOwn ? 'Create your first content now.' : 'This creator has no content yet.'}</span>
                {user.isOwn && <a href="/create">Create now</a>}
              </div>
            )}
          </section>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
