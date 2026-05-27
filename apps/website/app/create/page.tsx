'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type CreateType = 'post' | 'reel' | 'story'

type SessionUser = {
  userId: string
  id: string
  username: string
  name: string
}

function normalizeUsername(value?: string) {
  const clean = String(value || '').trim()
  if (!clean) return '@you'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function mediaKindFromUrl(url: string, selectedType: CreateType) {
  const clean = url.toLowerCase()

  if (selectedType === 'reel') return 'video'
  if (clean.includes('.mp4') || clean.includes('.webm') || clean.includes('.mov')) return 'video'
  return 'image'
}

function validPreview(url: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

export default function CreatePage() {
  const [session, setSession] = useState<SessionUser>({
    userId: 'USR-YOU',
    id: 'USR-YOU',
    username: '@you',
    name: 'Creator'
  })

  const [type, setType] = useState<CreateType>('post')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('VibeLoop')
  const [mediaUrl, setMediaUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [createdId, setCreatedId] = useState('')

  useEffect(() => {
    async function load() {
      const user = await getSessionUser()
      setSession({
        ...user,
        username: normalizeUsername(user.username)
      })

      const params = new URLSearchParams(window.location.search)
      const requestedType = params.get('type')

      if (requestedType === 'reel' || requestedType === 'story' || requestedType === 'post') {
        setType(requestedType)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (type === 'reel') {
      setMediaType('video')
    }
  }, [type])

  const previewUrl = useMemo(() => {
    return videoUrl || mediaUrl
  }, [mediaUrl, videoUrl])

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    setUploading(true)
    setMessage('')
    setCreatedId('')
    setSelectedFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed.')
      }

      setMediaUrl(data.mediaUrl || '')
      setVideoUrl(data.videoUrl || '')
      setMediaType(data.mediaType === 'video' ? 'video' : 'image')
      setMessage('Media uploaded successfully.')
    } catch (error: any) {
      setMessage(error?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleMediaUrlChange(value: string) {
    setMediaUrl(value)
    setVideoUrl(type === 'reel' ? value : '')
    setMediaType(mediaKindFromUrl(value, type))
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setCreatedId('')

    try {
      const finalMediaUrl = mediaUrl.trim()
      const finalVideoUrl = videoUrl.trim() || (mediaType === 'video' ? finalMediaUrl : '')

      if (!title.trim()) {
        throw new Error('Title is required.')
      }

      if (!finalMediaUrl && !finalVideoUrl) {
        throw new Error('Upload media or paste media URL.')
      }

      const response = await fetch('/api/content/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kind: type,
          type,
          title: title.trim(),
          caption: caption.trim(),
          location: location.trim() || 'VibeLoop',
          username: session.username,
          user: session.username,
          name: session.name,
          userId: session.userId,
          mediaUrl: finalMediaUrl || finalVideoUrl,
          videoUrl: finalVideoUrl,
          mediaType,
          likes: 0,
          comments: 0,
          views: 0
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Content save failed.')
      }

      const newId = data.item?.id || data.post?.id || data.reel?.id || data.story?.id || ''
      setCreatedId(newId)
      setMessage(`${type.toUpperCase()} saved to backend successfully.`)

      setTitle('')
      setCaption('')
      setMediaUrl('')
      setVideoUrl('')
      setSelectedFileName('')
      setMediaType(type === 'reel' ? 'video' : 'image')
    } catch (error: any) {
      setMessage(error?.message || 'Content save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="create" title="" subtitle="" hideSearch>
        <main className="vlxCreatePage">
          <header className="vlxCreateHeader">
            <div>
              <h1>Create</h1>
              <p>Upload post, reel or story directly to backend.</p>
            </div>

            <a href="/home">Home</a>
          </header>

          <nav className="vlxCreateTabs">
            {(['post', 'reel', 'story'] as CreateType[]).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setType(item)}
                className={type === item ? 'active' : ''}
              >
                {item === 'post' && '▧ Post'}
                {item === 'reel' && '▣ Reel'}
                {item === 'story' && '◉ Story'}
              </button>
            ))}
          </nav>

          <section className="vlxCreateUser">
            <div>{session.name.slice(0, 1).toUpperCase()}</div>
            <span>
              <b>{session.name}</b>
              <small>{session.username}</small>
            </span>
          </section>

          <form className="vlxCreateForm" onSubmit={handleCreate}>
            <label>
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={`Enter ${type} title`}
              />
            </label>

            <label>
              Caption
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Write caption..."
                rows={4}
              />
            </label>

            <label>
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location"
              />
            </label>

            <div className="vlxUploadBox">
              <div>
                <h2>Upload media</h2>
                <p>
                  {type === 'reel'
                    ? 'Upload MP4/WebM video for reels.'
                    : 'Upload image/video or paste URL.'}
                </p>
              </div>

              <input
                type="file"
                accept={type === 'reel' ? 'video/*' : 'image/*,video/*'}
                onChange={handleFileUpload}
              />

              {selectedFileName && <small>{selectedFileName}</small>}
              {uploading && <small>Uploading media...</small>}
            </div>

            <label>
              Or paste media URL
              <input
                value={mediaUrl}
                onChange={(event) => handleMediaUrlChange(event.target.value)}
                placeholder={type === 'reel' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'\}
              />
            </label>

            {previewUrl && (
              <section className="vlxCreatePreview">
                <h2>Preview</h2>

                <div>
                  {mediaType === 'video' ? (
                    <video src={previewUrl} controls playsInline />
                  ) : validPreview(previewUrl) ? (
                    <img src={previewUrl} alt="Preview" />
                  ) : (
                    <span>Invalid preview URL</span>
                  )}
                </div>
              </section>
            )}

            {message && (
              <section className={`vlxCreateMessage ${createdId ? 'success' : ''}`}>
                {message}

                {createdId && (
                  <div>
                    <a href={`/post/${encodeURIComponent(createdId)}`}>View Content</a>
                    {type === 'reel' && <a href="/reels">Open Reels</a>}
                    {type !== 'reel' && <a href="/home">Open Home</a>}
                  </div>
                )}
              </section>
            )}

            <button className="vlxCreateSubmit" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : `Publish ${type}`}
            </button>
          </form>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
