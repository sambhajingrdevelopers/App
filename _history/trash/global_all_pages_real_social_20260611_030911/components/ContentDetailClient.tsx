'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import AuthGuard from './AuthGuard'
import SocialAppShell from './SocialAppShell'

type Kind = 'post' | 'reel' | 'story'

function prox(url: any) {
  const clean = String(url || '').trim()
  if (!clean) return ''
  if (clean.startsWith('/api/media/proxy')) return clean
  if (clean.startsWith('data:')) return clean
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/media/')) {
    return `/api/media/proxy?url=${encodeURIComponent(clean)}`
  }
  return clean
}

function normalize(raw: any, kind: Kind) {
  const item = raw || {}
  const usernameRaw = String(item.username || item.user || item.creator || '@creator')
  const username = usernameRaw.startsWith('@') ? usernameRaw : `@${usernameRaw}`
  const media = item.mediaUrl || item.media_url || item.imageUrl || item.image_url || ''
  const video = item.videoUrl || item.video_url || ''
  const mediaType = item.mediaType || item.media_type || (kind === 'reel' || video ? 'video' : 'image')

  return {
    ...item,
    kind,
    type: kind,
    username,
    user: username,
    creator: username,
    name: item.name || username.replace('@', '') || 'Creator',
    title: item.title || item.caption || (kind === 'reel' ? 'Reel' : kind === 'story' ? 'Story' : 'Post'),
    caption: item.caption || item.title || '',
    location: item.location || 'VibeLoop',
    mediaType,
    mediaUrl: prox(media || video),
    imageUrl: prox(media),
    videoUrl: prox(video || (mediaType === 'video' ? media : '')),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    shares: Number(item.shares || 0),
    views: Number(item.views || 0),
    liked: Boolean(item.liked),
    saved: Boolean(item.saved)
  }
}

export default function ContentDetailClient({ kind }: { kind: Kind }) {
  const params = useParams()
  const id = String(params.id || '')

  const [item, setItem] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [text, setText] = useState('')
  const [menu, setMenu] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [mediaBroken, setMediaBroken] = useState(false)

  const active = kind === 'reel' ? 'reels' : 'home'
  const title = kind === 'reel' ? 'Reel Detail' : kind === 'story' ? 'Story Detail' : 'Post Detail'

  const isVideo = useMemo(() => {
    const src = item?.videoUrl || item?.mediaUrl || ''
    return kind === 'reel' || item?.mediaType === 'video' || /\.(mp4|webm|mov)$/i.test(src)
  }, [item, kind])

  async function load() {
    setLoading(true)
    setMsg('')
    setMediaBroken(false)

    try {
      const res = await fetch(`/api/detail/${kind}/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const data = await res.json()

      const raw = data.item || data.post || data.reel || data.story
      if (!res.ok || !data.success || !raw) throw new Error(data.message || `${title} not found`)

      setItem(normalize(raw, kind))
      setComments(Array.isArray(data.comments) ? data.comments : [])
    } catch (e: any) {
      setItem(null)
      setMsg(e?.message || `${title} not found`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  async function act(action: string, body: any = {}) {
    await fetch(`/api/action/${kind}/${encodeURIComponent(id)}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(() => {})
  }

  function like() {
    if (!item) return
    const liked = !item.liked
    const likes = Math.max(0, Number(item.likes || 0) + (liked ? 1 : -1))
    setItem({ ...item, liked, likes })
    act('like', { liked, likes })
  }

  function save() {
    if (!item) return
    const saved = !item.saved
    setItem({ ...item, saved })
    setMsg(saved ? 'Saved.' : 'Removed from saved.')
    act('save', { saved })
  }

  async function share() {
    const url = `${window.location.origin}/${kind}/${encodeURIComponent(id)}`

    try {
      if (navigator.share) await navigator.share({ title: item?.title || title, text: item?.caption || '', url })
      else await navigator.clipboard.writeText(url)
    } catch {
      try { await navigator.clipboard.writeText(url) } catch {}
    }

    const shares = Number(item?.shares || 0) + 1
    setItem((prev: any) => prev ? { ...prev, shares } : prev)
    setMsg('Link shared/copied.')
    act('share', { shares })
  }

  async function addComment() {
    const clean = text.trim()
    if (!clean) {
      setMsg('Write comment first.')
      return
    }

    setText('')

    const local = {
      id: `LOCAL-${Date.now()}`,
      user: '@you',
      text: clean,
      createdAt: new Date().toISOString()
    }

    setComments((prev) => [...prev, local])
    setItem((prev: any) => prev ? { ...prev, comments: Number(prev.comments || 0) + 1 } : prev)

    try {
      const res = await fetch(`/api/comment/${kind}/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, user: '@you' })
      })

      const data = await res.json()
      if (data.success && data.comment) {
        setComments((prev) => prev.map((x) => x.id === local.id ? data.comment : x))
      }
    } catch {}

    setMsg('Comment added.')
  }

  return (
    <AuthGuard>
      <SocialAppShell active={active as any} title={title} subtitle="Dynamic detail page connected to backend content.">
        {msg && <div className="vlSettingsMessage">{msg}</div>}
        {loading && <div className="adminEmpty">Loading...</div>}
        {!loading && !item && <div className="adminEmpty">{title} not found or backend not ready.</div>}

        {item && (
          <section className={`vlxDynamicDetail ${kind}`}>
            <article className="vlxDynamicCard">
              <header className="vlxDynamicHeader">
                <div className="vlAvatar">{item.name?.[0] || item.user?.[1] || 'V'}</div>

                <div>
                  <b>{item.user} ✓</b>
                  <span>{item.location}</span>
                </div>

                <div className="vlxMenuWrap">
                  <button type="button" className="vlxMenuBtn" onClick={() => setMenu(!menu)}>⋯</button>
                  {menu && (
                    <div className="vlxMenuBox">
                      <button type="button" onClick={save}>{item.saved ? 'Unsave' : 'Save'}</button>
                      <button type="button" onClick={share}>Copy / Share</button>
                      <button type="button" onClick={() => setMsg('Reported for review.')}>Report</button>
                    </div>
                  )}
                </div>
              </header>

              <div className={`vlxDynamicMedia ${mediaBroken ? 'broken' : ''}`}>
                {!mediaBroken && (item.mediaUrl || item.videoUrl) ? (
                  isVideo ? (
                    <video
                      src={item.videoUrl || item.mediaUrl}
                      controls
                      playsInline
                      onError={() => setMediaBroken(true)}
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title || item.caption || 'Content'}
                      onError={() => setMediaBroken(true)}
                    />
                  )
                ) : (
                  <div className="vlxMediaFallback">
                    <b>{item.title}</b>
                    <p>{item.caption || 'Media file not available from backend.'}</p>
                  </div>
                )}
              </div>

              <p className="vlxDynamicCaption"><b>{item.user}</b> {item.caption}</p>

              <div className="vlxDynamicActions">
                <button type="button" className={item.liked ? 'active' : ''} onClick={like}>
                  {item.liked ? '♥' : '♡'} {item.likes || 0}
                </button>

                <button type="button" onClick={() => document.getElementById('dynamicCommentBox')?.focus()}>
                  💬 {comments.length}
                </button>

                <button type="button" className={item.saved ? 'active' : ''} onClick={save}>
                  🔖 {item.saved ? 'Saved' : 'Save'}
                </button>

                <button type="button" onClick={share}>
                  ↗ {item.shares || 0}
                </button>
              </div>
            </article>

            <section className="vlxDynamicComments">
              <h3>Comments</h3>

              <div className="vlxCommentComposer">
                <textarea
                  id="dynamicCommentBox"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write comment..."
                />
                <button type="button" onClick={addComment}>Post</button>
              </div>

              <div className="vlxCommentsList">
                {comments.map((comment) => (
                  <article key={comment.id}>
                    <div>
                      <b>{comment.user || '@user'}</b>
                      <p>{comment.text}</p>
                      <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now'}</span>
                    </div>
                  </article>
                ))}

                {!comments.length && <div className="adminEmpty">No comments yet.</div>}
              </div>
            </section>
          </section>
        )}
      </SocialAppShell>
    </AuthGuard>
  )
}
