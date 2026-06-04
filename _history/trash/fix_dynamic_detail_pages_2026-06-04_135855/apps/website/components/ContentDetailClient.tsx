'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import AuthGuard from './AuthGuard'
import SocialAppShell from './SocialAppShell'

type DetailKind = 'post' | 'reel'

function mediaUrl(url: any) {
  const clean = String(url || '').trim()
  if (!clean) return ''
  if (clean.startsWith('/api/media/proxy')) return clean
  if (clean.startsWith('data:')) return clean
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/media/')) {
    return `/api/media/proxy?url=${encodeURIComponent(clean)}`
  }
  return clean
}

function normalize(item: any, kind: DetailKind) {
  const raw = item || {}
  const usernameRaw = String(raw.username || raw.user || raw.creator || '@creator')
  const username = usernameRaw.startsWith('@') ? usernameRaw : `@${usernameRaw}`
  const m = raw.mediaUrl || raw.media_url || raw.imageUrl || raw.image_url || ''
  const v = raw.videoUrl || raw.video_url || ''
  const mediaType = raw.mediaType || raw.media_type || (kind === 'reel' || v ? 'video' : 'image')

  return {
    ...raw,
    id: raw.id,
    kind,
    type: kind,
    username,
    user: username,
    creator: username,
    name: raw.name || username.replace('@', '') || 'Creator',
    title: raw.title || raw.caption || (kind === 'reel' ? 'Reel' : 'Post'),
    caption: raw.caption || raw.title || '',
    location: raw.location || 'VibeLoop',
    mediaType,
    mediaUrl: mediaUrl(m || v),
    videoUrl: mediaUrl(v || (mediaType === 'video' ? m : '')),
    likes: Number(raw.likes || 0),
    comments: Number(raw.comments || 0),
    shares: Number(raw.shares || 0),
    views: Number(raw.views || 0),
    liked: Boolean(raw.liked),
    saved: Boolean(raw.saved)
  }
}

export default function ContentDetailClient({ kind }: { kind: DetailKind }) {
  const params = useParams()
  const id = String(params.id || '')

  const [item, setItem] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [text, setText] = useState('')
  const [menu, setMenu] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const apiBase = kind === 'reel' ? 'reels' : 'posts'
  const title = kind === 'reel' ? 'Reel Detail' : 'Post Detail'
  const active = kind === 'reel' ? 'reels' : 'home'

  const isVideo = useMemo(() => {
    const src = item?.videoUrl || item?.mediaUrl || ''
    return kind === 'reel' || item?.mediaType === 'video' || /\.(mp4|webm|mov)$/i.test(src)
  }, [item, kind])

  async function load() {
    setLoading(true)
    setMsg('')

    try {
      const res = await fetch(`/api/${apiBase}/${encodeURIComponent(id)}/detail`, { cache: 'no-store' })
      const data = await res.json()

      const raw = data.item || data.post || data.reel
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

  async function like() {
    if (!item) return
    const liked = !item.liked
    const likes = Math.max(0, Number(item.likes || 0) + (liked ? 1 : -1))
    setItem({ ...item, liked, likes })

    fetch(`/api/${apiBase}/${encodeURIComponent(id)}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liked, likes })
    }).catch(() => {})
  }

  async function save() {
    if (!item) return
    const saved = !item.saved
    setItem({ ...item, saved })
    setMsg(saved ? 'Saved.' : 'Removed from saved.')

    fetch(`/api/${apiBase}/${encodeURIComponent(id)}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved })
    }).catch(() => {})
  }

  async function share() {
    const url = `${window.location.origin}/${kind}/${encodeURIComponent(id)}`

    try {
      if (navigator.share) await navigator.share({ title: item?.title || title, text: item?.caption || '', url })
      else await navigator.clipboard.writeText(url)
    } catch {
      try { await navigator.clipboard.writeText(url) } catch {}
    }

    setItem((prev: any) => prev ? { ...prev, shares: Number(prev.shares || 0) + 1 } : prev)
    setMsg('Link shared/copied.')
    fetch(`/api/${apiBase}/${encodeURIComponent(id)}/share`, { method: 'POST' }).catch(() => {})
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
      const res = await fetch(`/api/${apiBase}/${encodeURIComponent(id)}/comments`, {
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

  async function deleteComment(commentId: any) {
    setComments((prev) => prev.filter((x) => String(x.id) !== String(commentId)))
    setItem((prev: any) => prev ? { ...prev, comments: Math.max(0, Number(prev.comments || 0) - 1) } : prev)

    if (kind === 'post') {
      fetch(`/api/posts/${encodeURIComponent(id)}/comments/${encodeURIComponent(String(commentId))}`, { method: 'DELETE' }).catch(() => {})
    }

    setMsg('Comment removed.')
  }

  return (
    <AuthGuard>
      <SocialAppShell active={active as any} title={title} subtitle="Like, comment, save, share and open more actions.">
        {msg && <div className="vlSettingsMessage">{msg}</div>}
        {loading && <div className="adminEmpty">Loading...</div>}
        {!loading && !item && <div className="adminEmpty">{title} not found or backend not ready.</div>}

        {item && (
          <section className={kind === 'reel' ? 'vlxFixedDetail reel' : 'vlxFixedDetail'}>
            <article className="vlxFixedCard">
              <header className="vlxFixedHeader">
                <div className="vlAvatar">{item.name?.[0] || item.user?.[1] || 'V'}</div>
                <div>
                  <b>{item.user} ✓</b>
                  <span>{item.location}</span>
                </div>

                <div className="vlxMenuWrap">
                  <button className="vlxMenuBtn" type="button" onClick={() => setMenu(!menu)}>⋯</button>
                  {menu && (
                    <div className="vlxMenuBox">
                      <button type="button" onClick={save}>{item.saved ? 'Unsave' : 'Save'}</button>
                      <button type="button" onClick={share}>Copy / Share</button>
                      <button type="button" onClick={() => setMsg('Reported for review.')}>Report</button>
                    </div>
                  )}
                </div>
              </header>

              <div className={kind === 'reel' ? 'vlxFixedMedia reel' : 'vlxFixedMedia'}>
                {(item.mediaUrl || item.videoUrl) ? (
                  isVideo ? (
                    <video src={item.videoUrl || item.mediaUrl} controls playsInline />
                  ) : (
                    <img src={item.mediaUrl} alt={item.title || 'Post'} />
                  )
                ) : (
                  <div className="vlxFixedFallback">
                    <h2>{item.title}</h2>
                    <p>{item.caption}</p>
                  </div>
                )}
              </div>

              <p className="vlxFixedCaption"><b>{item.user}</b> {item.caption}</p>

              <div className="vlxFixedActions">
                <button className={item.liked ? 'active' : ''} type="button" onClick={like}>
                  {item.liked ? '♥' : '♡'} {item.likes || 0}
                </button>
                <button type="button" onClick={() => document.getElementById('vlxCommentBox')?.focus()}>
                  �� {comments.length}
                </button>
                <button className={item.saved ? 'active' : ''} type="button" onClick={save}>
                  🔖 {item.saved ? 'Saved' : 'Save'}
                </button>
                <button type="button" onClick={share}>↗ {item.shares || 0}</button>
              </div>
            </article>

            <section className="vlxFixedComments">
              <h3>Comments</h3>

              <div className="vlxCommentComposer">
                <textarea id="vlxCommentBox" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write comment..." />
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
                    <button type="button" onClick={() => deleteComment(comment.id)}>Delete</button>
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
