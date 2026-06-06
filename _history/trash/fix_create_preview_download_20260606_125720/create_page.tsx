'use client'


function normalizePreviewUrl(url: any) {
  const raw = String(url || "").trim()
  if (!raw) return ""

  if (raw.startsWith("blob:")) return raw
  if (raw.startsWith("data:")) return raw
  if (raw.startsWith("/media/")) return raw

  if (raw.startsWith("http://13.206.145.54:8003/media/")) {
    return raw.replace("http://13.206.145.54:8003", "")
  }

  if (raw.startsWith("https://13.206.145.54:8003/media/")) {
    return raw.replace("https://13.206.145.54:8003", "")
  }

  if (raw.startsWith("http")) return raw
  return raw
}

function isValidPreviewUrl(url: any) {
  const normalized = normalizePreviewUrl(url)
  return Boolean(
    normalized &&
    (
      normalized.startsWith("blob:") ||
      normalized.startsWith("data:") ||
      normalized.startsWith("/media/") ||
      normalized.startsWith("http")
    )
  )
}


import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type CreateType = 'post' | 'reel' | 'story'
type MediaType = 'image' | 'video'
type PrivacyType = 'public' | 'followers' | 'private'
type CreateStep = 'upload' | 'edit' | 'details'
type FilterType = 'normal' | 'vivid' | 'warm' | 'cool' | 'noir' | 'vintage'
type CropRatio = 'original' | '1:1' | '4:5' | '9:16' | '16:9'

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

function displayMediaUrl(url: string) {
  const clean = String(url || '').trim()
  if (!clean) return ''
  if (clean.startsWith('data:')) return clean
  if (clean.startsWith('/media/')) return clean
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/media/')) {
    return `/api/media/proxy?url=${encodeURIComponent(clean)}`
  }
  return clean
}

function validPreview(url: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

function detectMediaType(url: string, selectedType: CreateType): MediaType {
  const clean = url.toLowerCase()
  if (selectedType === 'reel') return 'video'
  if (clean.includes('.mp4') || clean.includes('.webm') || clean.includes('.mov') || clean.includes('video')) return 'video'
  return 'image'
}

function splitSmart(value: string) {
  return String(value || '')
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeHash(value: string) {
  const clean = value.trim().replace(/^#+/, '')
  return clean ? `#${clean}` : ''
}

function normalizeUser(value: string) {
  const clean = value.trim().replace(/^@+/, '')
  return clean ? `@${clean}` : ''
}

function filterCss(name: FilterType, b: number, c: number, sat: number) {
  const presets: Record<FilterType, string> = {
    normal: '', vivid: 'contrast(1.12) saturate(1.28)', warm: 'sepia(.18) saturate(1.18) hue-rotate(-8deg)',
    cool: 'saturate(1.1) hue-rotate(10deg)', noir: 'grayscale(1) contrast(1.16)', vintage: 'sepia(.34) contrast(1.08) saturate(.9)'
  }
  return `${presets[name]} brightness(${b}%) contrast(${c}%) saturate(${sat}%)`.trim()
}

// PHASE3_CAMERA_CROP_FILTER_SMALL
// PHASE4_STEP_MEDIA_FIX
// PHASE_NATIVE_MOBILE_CAMERA_FLOW
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
  const [hashtags, setHashtags] = useState('')
  const [mentions, setMentions] = useState('')
  const [tagPeople, setTagPeople] = useState('')
  const [collaborator, setCollaborator] = useState('')
  const [location, setLocation] = useState('VibeLoop')
  const [musicTitle, setMusicTitle] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [privacy, setPrivacy] = useState<PrivacyType>('public')
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [hideLikeCount, setHideLikeCount] = useState(false)
  const [shareToFeed, setShareToFeed] = useState(true)
  const [saveAsDraft, setSaveAsDraft] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [createdId, setCreatedId] = useState('')
  const nativePhotoInputRef = useRef<HTMLInputElement | null>(null)
  const nativeVideoInputRef = useRef<HTMLInputElement | null>(null)
  const [createStep, setCreateStep] = useState<CreateStep>('upload')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [filterName, setFilterName] = useState<FilterType>('normal')
  const [cropRatio, setCropRatio] = useState<CropRatio>('original')
  const [zoom, setZoom] = useState(1)
  const [cropX, setCropX] = useState(0)
  const [cropY, setCropY] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [trimStart, setTrimStart] = useState('')
  const [trimEnd, setTrimEnd] = useState('')
  const camRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    async function loadSession() {
      const user = await getSessionUser()

      setSession({
        userId: user.userId,
        id: user.id,
        username: normalizeUsername(user.username),
        name: user.name || 'Creator'
      })

      const params = new URLSearchParams(window.location.search)
      const requestedType = params?.get('type')

      if (requestedType === 'post' || requestedType === 'reel' || requestedType === 'story') {
        setType(requestedType)
        setMediaType(requestedType === 'reel' ? 'video' : 'image')
      }
    }

    loadSession()
  }, [])

  const previewUrl = useMemo(() => videoUrl || mediaUrl, [videoUrl, mediaUrl])
  const previewDisplayUrl = useMemo(() => displayMediaUrl(previewUrl), [previewUrl])
  const editFilter = useMemo(() => filterCss(filterName, brightness, contrast, saturation), [filterName, brightness, contrast, saturation])
  const editTransform = useMemo(() => `translate(${cropX}px, ${cropY}px) scale(${zoom})`, [cropX, cropY, zoom])
  const cropClass = `crop-${cropRatio.replace(':', '-')}`

  const hashtagList = useMemo(() => {
    const manual = splitSmart(hashtags).map(normalizeHash).filter(Boolean)
    const fromCaption = splitSmart(caption)
      .filter((item) => item.startsWith('#'))
      .map(normalizeHash)
      .filter(Boolean)
    return Array.from(new Set([...manual, ...fromCaption]))
  }, [hashtags, caption])

  const mentionList = useMemo(() => {
    const manual = splitSmart(mentions).map(normalizeUser).filter(Boolean)
    const fromCaption = splitSmart(caption)
      .filter((item) => item.startsWith('@'))
      .map(normalizeUser)
      .filter(Boolean)
    return Array.from(new Set([...manual, ...fromCaption]))
  }, [mentions, caption])

  const taggedUsers = useMemo(() => {
    return splitSmart(tagPeople).map(normalizeUser).filter(Boolean)
  }, [tagPeople])

  const collaborators = useMemo(() => {
    return splitSmart(collaborator).map(normalizeUser).filter(Boolean)
  }, [collaborator])

  const detailHref = useMemo(() => {
    if (!createdId) return ''
    if (type === 'reel') return `/reel/${encodeURIComponent(createdId)}`
    if (type === 'story') return `/story/${encodeURIComponent(createdId)}`
    return `/post/${encodeURIComponent(createdId)}`
  }, [createdId, type])

  // PHASE_AUTO_OPEN_CAMERA_QUERY
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params?.get('web') === '1') {
      const shouldRecord = params?.get('record') === '1' || params?.get('type') === 'reel'
      setTimeout(() => startCamera(shouldRecord), 450)
    }
  }, [])

  // PHASE_NATIVE_CAMERA_QUERY_AUTO_OPEN
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shouldOpenCamera = params?.get('native') === '1'
    if (!shouldOpenCamera) return

    const requestedType = params?.get('type')
    if (requestedType === 'reel') {
      setType('reel')
      setMediaType('video')
    }

    // Browser may block auto-open on some phones. Button remains visible if blocked.
    setTimeout(() => {
      if (requestedType === 'reel' || params?.get('record') === '1') {
        nativeVideoInputRef.current?.click()
      } else {
        nativePhotoInputRef.current?.click()
      }
    }, 500)
  }, [])

  // PHASE_NATIVE_ONLY_QUERY_OPEN
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params?.get('native') !== '1') return

    const requestedType = params?.get('type')
    const record = params?.get('record') === '1' || requestedType === 'reel'

    if (record) {
      setType('reel')
      setMediaType('video')
    }

    setTimeout(() => {
      if (record) {
        nativeVideoInputRef.current?.click()
      } else {
        nativePhotoInputRef.current?.click()
      }
    }, 350)
  }, [])

  // PHASE_CAMERA_REDIRECT_MEDIA_QUERY
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const incomingMedia = params?.get('mediaUrl') || ''
    const incomingVideo = params?.get('videoUrl') || ''
    const incomingType = params?.get('mediaType') || ''
    const incomingCreateType = params?.get('type')

    if (!incomingMedia && !incomingVideo) return

    if (incomingCreateType === 'post' || incomingCreateType === 'reel' || incomingCreateType === 'story') {
      setType(incomingCreateType)
    }

    setMediaUrl(incomingMedia || incomingVideo)
    setVideoUrl(incomingVideo)
    setMediaType(incomingType === 'video' || incomingCreateType === 'reel' ? 'video' : 'image')
    setCreateStep('edit')
    setMessage('Camera media ready. Edit it, then continue to publish.')

    const qLocation = params?.get('location') || ''
    const qMusicTitle = params?.get('musicTitle') || ''
    const qAudioUrl = params?.get('audioUrl') || ''

    if (qLocation && typeof setLocation === 'function') setLocation(qLocation)
    if (qMusicTitle && typeof setMusicTitle === 'function') setMusicTitle(qMusicTitle)
    if (qAudioUrl && typeof setAudioUrl === 'function') setAudioUrl(qAudioUrl)
    // PHASE_CAMERA_QUERY_EXTRA_FIELDS
  }, [])

  const publishLabel = saveAsDraft ? `Save ${type} draft` : `Publish ${type}`


  // PHASE_NATIVE_MOBILE_CAMERA_FLOW
  function openNativeMobileCamera(recordVideo = false) {
    setMessage('')
    if (recordVideo) {
      setType('reel')
      setMediaType('video')
      nativeVideoInputRef.current?.click()
      return
    }

    nativePhotoInputRef.current?.click()
  }

  function openNativeMobileVideo() {
    setType('reel')
    setMediaType('video')
    nativeVideoInputRef.current?.click()
  }

  function switchType(nextType: CreateType) {
    setType(nextType)
    setCreatedId('')
    setMessage('')
    setMediaType(nextType === 'reel' ? 'video' : detectMediaType(previewUrl, nextType))
    if (nextType === 'reel' || nextType === 'story') setCropRatio('9:16')
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOpen(false)
    setRecording(false)
  }

  async function startCamera(video = false) {
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: video })
      streamRef.current = stream
      setCameraOpen(true)
      setTimeout(() => {
        if (camRef.current) { camRef.current.srcObject = stream; camRef.current.play().catch(() => undefined) }
      }, 80)
    } catch (e: any) { setMessage(e?.message || 'Camera permission failed') }
  }

  async function uploadBlob(blob: Blob, fileName: string) {
    const formData = new FormData()
    formData.append('file', new File([blob], fileName, { type: blob.type }))
    const res = await fetch('/api/content/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed')
    return data
  }

  async function capturePhoto() {
    const video = camRef.current
    if (!video) return
    setUploading(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1080
      canvas.height = video.videoHeight || 1920
      const ctx = canvas.getContext('2d')!
      ctx.filter = editFilter || 'none'
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((ok, bad) => canvas.toBlob((b) => b ? ok(b) : bad(new Error('Capture failed')), 'image/jpeg', .92))
      const data = await uploadBlob(blob, `camera-${Date.now()}.jpg`)
      setMediaUrl(data.mediaUrl || data.url || '')
      setVideoUrl('')
      setMediaType('image')
      setSelectedFileName('Camera photo')
      setMessage('Camera photo captured. Crop/filter ready.')
      stopCamera()
    } catch (e: any) { setMessage(e?.message || 'Photo capture failed') } finally { setUploading(false) }
  }

  function startRecording() {
    const stream = streamRef.current
    if (!stream || typeof MediaRecorder === 'undefined') return setMessage('Recording not supported')
    chunksRef.current = []
    const rec = new MediaRecorder(stream)
    recRef.current = rec
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
    rec.onstop = async () => {
      setUploading(true)
      try {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const data = await uploadBlob(blob, `camera-${Date.now()}.webm`)
        setMediaUrl(data.mediaUrl || data.url || '')
        setVideoUrl(data.videoUrl || data.mediaUrl || data.url || '')
        setMediaType('video')
        setSelectedFileName('Camera video')
        setMessage('Camera video uploaded. Trim/filter metadata ready.')
        stopCamera()
      } catch (e: any) { setMessage(e?.message || 'Video upload failed') } finally { setUploading(false) }
    }
    rec.start()
    setRecording(true)
  }

  function stopRecording() { recRef.current?.stop(); setRecording(false) }

  async function applyImageEditor() {
    if (!previewUrl || mediaType !== 'image') return setMessage('Crop/filter apply works for images. Video settings save as metadata.')
    setUploading(true)
    try {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.src = previewDisplayUrl
      await new Promise((ok, bad) => { image.onload = ok; image.onerror = bad })
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = cropRatio === '9:16' ? 1920 : cropRatio === '4:5' ? 1350 : cropRatio === '16:9' ? 608 : 1080
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#05050a'; ctx.fillRect(0,0,canvas.width,canvas.height)
      ctx.filter = editFilter || 'none'
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height) * zoom
      const w = image.width * scale, h = image.height * scale
      ctx.drawImage(image, (canvas.width - w) / 2 + cropX, (canvas.height - h) / 2 + cropY, w, h)
      const blob = await new Promise<Blob>((ok, bad) => canvas.toBlob((b) => b ? ok(b) : bad(new Error('Edit failed')), 'image/jpeg', .92))
      const data = await uploadBlob(blob, `edited-${Date.now()}.jpg`)
      setMediaUrl(data.mediaUrl || data.url || '')
      setVideoUrl('')
      setMessage('Crop/filter applied and uploaded.')
    } catch (e: any) { setMessage(e?.message || 'Apply edit failed') } finally { setUploading(false) }
  }

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

      const nextMediaUrl = data.mediaUrl || data.url || ''
      const nextVideoUrl = data.videoUrl || (data.mediaType === 'video' ? nextMediaUrl : '')
      const nextMediaType: MediaType = data.mediaType === 'video' ? 'video' : detectMediaType(nextVideoUrl || nextMediaUrl, type)

      setMediaUrl(nextMediaUrl)
      setVideoUrl(nextVideoUrl)
      setMediaType(nextMediaType)
      setCreateStep('edit')
      setCreateStep('edit')
      setMessage('Media uploaded successfully. Now add caption, tags and publish.')
    } catch (error: any) {
      setMessage(error?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleMediaUrlChange(value: string) {
    setMediaUrl(value)
    const detected = detectMediaType(value, type)
    setMediaType(detected)
    setVideoUrl(detected === 'video' ? value : '')
    if (value.trim()) setCreateStep('edit')
  }

  function resetAfterCreate() {
    setTitle('')
    setCaption('')
    setHashtags('')
    setMentions('')
    setTagPeople('')
    setCollaborator('')
    setMusicTitle('')
    setAudioUrl('')
    setCoverUrl('')
    setMediaUrl('')
    setVideoUrl('')
    setSelectedFileName('')
    setMediaType(type === 'reel' ? 'video' : 'image')
    setSaveAsDraft(false)
    setCreateStep('upload')
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

      if (type === 'reel' && mediaType !== 'video') {
        throw new Error('Reel requires video media.')
      }

      const payload = {
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
        coverUrl: coverUrl.trim(),
        coverImage: coverUrl.trim(),
        musicTitle: musicTitle.trim(),
        audioUrl: audioUrl.trim(),
        hashtags: hashtagList,
        mentions: mentionList,
        taggedUsers,
        collaborators,
        privacy,
        commentsEnabled,
        hideLikeCount,
        shareToFeed: type === 'reel' ? shareToFeed : true,
        status: saveAsDraft ? 'draft' : 'published',
        isDraft: saveAsDraft,
        editorSettings: { cropRatio, zoom, cropX, cropY, filterName, brightness, contrast, saturation, trimStart, trimEnd },
        likes: 0,
        comments: 0,
        views: 0
      }

      const response = await fetch('/api/content/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Content save failed.')
      }

      const newId = data.item?.id || data.post?.id || data.reel?.id || data.story?.id || ''
      setCreatedId(newId)
      setMessage(`${type.toUpperCase()} ${saveAsDraft ? 'draft saved' : 'published'} to real backend successfully.`)
      resetAfterCreate()
    } catch (error: any) {
      setMessage(error?.message || 'Content save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="create" title="" subtitle="" hideSearch>
        <main className="vlxCreatePage vlxInstagramCreateEditor">
          <header className="vlxCreateHeader vlxCreateTopBar">
            <div>
              <h1>Create</h1>
              <p>Instagram-style post, reel and story upload editor connected to backend.</p>
            </div>

            {/* PHASE_CAMERA_CREATE_TOP_LINK */}
            <div className="vlxCreateHeaderActions">
              <a className="vlxCreateCameraTop" href="/camera?type=post">📷 Camera</a>
<a href="/home">Home</a>
            </div>
          </header>

          <nav className="vlxCreateTabs vlxCreateTypeTabs" aria-label="Create type">
            <button type="button" onClick={() => switchType('post')} className={type === 'post' ? 'active' : ''}>
              🖼️ Post
            </button>
            <button type="button" onClick={() => switchType('reel')} className={type === 'reel' ? 'active' : ''}>
              ▶️ Reel
            </button>
            <button type="button" onClick={() => switchType('story')} className={type === 'story' ? 'active' : ''}>
              ⚡ Story
            </button>
          </nav>

          <section className="vlxCreateUser">
            <div>{session.name.slice(0, 1).toUpperCase()}</div>
            <span>
              <b>{session.name}</b>
              <small>{session.username} · real backend creator</small>
            </span>
          </section>

          <section className="vlxPhase4Steps">
            <button type="button" className={createStep === 'upload' ? 'active' : ''} onClick={() => setCreateStep('upload')}>1 Upload</button>
            <button type="button" className={createStep === 'edit' ? 'active' : ''} onClick={() => setCreateStep('edit')} disabled={!previewUrl}>2 Edit</button>
            <button type="button" className={createStep === 'details' ? 'active' : ''} onClick={() => setCreateStep('details')} disabled={!previewUrl}>3 Publish</button>
          </section>

          <form className="vlxCreateForm vlxPhase4StepForm" data-step={createStep} onSubmit={handleCreate}>
            <section className="vlxCreateEditorGrid">
              <div className="vlxCreateEditorLeft">
                <div className="vlxUploadBox vlxCreateMediaDrop">
                  <div>
                    <h2>{type === 'reel' ? 'Upload reel video' : 'Upload media'}</h2>
                    <p>
                      {type === 'reel'
                        ? 'Choose MP4/WebM video. It will appear in full-screen reels.'
                        : 'Choose image/video or paste a media URL.'}
                    </p>
                  </div>

                  <input
                    ref={nativePhotoInputRef}
                    className="vlxNativeCameraHidden"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                  />

                  <input
                    ref={nativeVideoInputRef}
                    className="vlxNativeCameraHidden"
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={handleFileUpload}
                  />
                  <input
                    type="file"
                    accept={type === 'reel' ? 'video/*' : 'image/*,video/*'}
                    onChange={handleFileUpload}
                  />
                  {selectedFileName && <small>Selected: {selectedFileName}</small>}
                  {uploading && <small>Uploading media...</small>}
                </div>
                <label className="vlxMediaUrlLabel">
                  Or paste media URL
                  <input
                    value={mediaUrl}
                    onChange={(event) => handleMediaUrlChange(event.target.value)}
                    placeholder="Paste image or video URL"
                  />
                </label>

                {previewUrl && (
                  <section className={`vlxCreatePreview ${type === 'reel' ? 'reelPreview' : ''}`}>
                    <h2>Live Preview</h2>

                    <div className={`vlxPhase3Preview ${cropClass}`}>
                      {mediaType === 'video' ? (
                        <video src={normalizePreviewUrl(previewDisplayUrl)} controls playsInline loop muted style={{ filter: editFilter }} />
                      ) : validPreview(previewDisplayUrl) ? (
                        <img src={normalizePreviewUrl(previewDisplayUrl)} alt="Preview" style={{ filter: editFilter, transform: editTransform }} />
                      ) : (
                        <span>Preview media loading...</span>
                      )}
                    </div>
                    <section className="vlxPhase3Tools">
                      <label>Crop ratio<select value={cropRatio} onChange={(e) => setCropRatio(e.target.value as CropRatio)}><option value="original">Original</option><option value="1:1">1:1</option><option value="4:5">4:5</option><option value="9:16">9:16</option><option value="16:9">16:9</option></select></label>
                      <label>Filter<select value={filterName} onChange={(e) => setFilterName(e.target.value as FilterType)}><option value="normal">Normal</option><option value="vivid">Vivid</option><option value="warm">Warm</option><option value="cool">Cool</option><option value="noir">Noir</option><option value="vintage">Vintage</option></select></label>
                      <label>Zoom<input type="range" min="1" max="2" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
                      <label>Crop X<input type="range" min="-90" max="90" value={cropX} onChange={(e) => setCropX(Number(e.target.value))} /></label>
                      <label>Crop Y<input type="range" min="-90" max="90" value={cropY} onChange={(e) => setCropY(Number(e.target.value))} /></label>
                      <label>Brightness<input type="range" min="60" max="160" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} /></label>
                      <label>Contrast<input type="range" min="60" max="160" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} /></label>
                      <label>Saturation<input type="range" min="40" max="180" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} /></label>
                      {mediaType === 'video' && <div className="vlxCreateTwoCol"><label>Trim start<input value={trimStart} onChange={(e) => setTrimStart(e.target.value)} placeholder="0:00" /></label><label>Trim end<input value={trimEnd} onChange={(e) => setTrimEnd(e.target.value)} placeholder="0:30" /></label></div>}
                      <button type="button" onClick={applyImageEditor}>Apply crop/filter</button>
                    </section>
                  </section>
                )}
              </div>

              <div className="vlxCreateEditorRight">
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
                    placeholder="Write caption... add #hashtags and @mentions"
                    rows={4}
                  />
                </label>

                <div className="vlxCreateTwoCol">
                  <label>
                    Hashtags
                    <input
                      value={hashtags}
                      onChange={(event) => setHashtags(event.target.value)}
                      placeholder="#travel #design"
                    />
                  </label>

                  <label>
                    Mentions
                    <input
                      value={mentions}
                      onChange={(event) => setMentions(event.target.value)}
                      placeholder="@user @brand"
                    />
                  </label>
                </div>

                <div className="vlxCreateChipPreview">
                  {hashtagList.slice(0, 8).map((tag) => <span key={tag}>{tag}</span>)}
                  {mentionList.slice(0, 8).map((tag) => <span key={tag}>{tag}</span>)}
                  {!hashtagList.length && !mentionList.length && <small>Tags preview will appear here.</small>}
                </div>

                <label>
                  Tag people
                  <input
                    value={tagPeople}
                    onChange={(event) => setTagPeople(event.target.value)}
                    placeholder="@friend @creator"
                  />
                </label>

                <label>
                  Add collaborator
                  <input
                    value={collaborator}
                    onChange={(event) => setCollaborator(event.target.value)}
                    placeholder="@collab_user"
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

                <div className="vlxCreateTwoCol">
                  <label>
                    Music / audio title
                    <input
                      value={musicTitle}
                      onChange={(event) => setMusicTitle(event.target.value)}
                      placeholder="Original audio"
                    />
                  </label>

                  <label>
                    Audio URL
                    <input
                      value={audioUrl}
                      onChange={(event) => setAudioUrl(event.target.value)}
                      placeholder="Optional audio URL"
                    />
                  </label>
                </div>

                <label>
                  Cover image URL
                  <input
                    value={coverUrl}
                    onChange={(event) => setCoverUrl(event.target.value)}
                    placeholder="Optional cover image URL"
                  />
                </label>

                <section className="vlxCreateSettingsPanel">
                  <label>
                    Privacy
                    <select value={privacy} onChange={(event) => setPrivacy(event.target.value as PrivacyType)}>
                      <option value="public">Public</option>
                      <option value="followers">Followers only</option>
                      <option value="private">Private</option>
                    </select>
                  </label>

                  <label className="vlxCreateToggle">
                    <input
                      type="checkbox"
                      checked={commentsEnabled}
                      onChange={(event) => setCommentsEnabled(event.target.checked)}
                    />
                    <span>Allow comments</span>
                  </label>

                  <label className="vlxCreateToggle">
                    <input
                      type="checkbox"
                      checked={hideLikeCount}
                      onChange={(event) => setHideLikeCount(event.target.checked)}
                    />
                    <span>Hide like count</span>
                  </label>

                  {type === 'reel' && (
                    <label className="vlxCreateToggle">
                      <input
                        type="checkbox"
                        checked={shareToFeed}
                        onChange={(event) => setShareToFeed(event.target.checked)}
                      />
                      <span>Share reel to feed</span>
                    </label>
                  )}

                  <label className="vlxCreateToggle">
                    <input
                      type="checkbox"
                      checked={saveAsDraft}
                      onChange={(event) => setSaveAsDraft(event.target.checked)}
                    />
                    <span>Save as draft instead of publish</span>
                  </label>
                </section>
              </div>
            </section>

            {createStep === 'upload' && previewUrl && (
              <button type="button" className="vlxPhase4NextBtn" onClick={() => setCreateStep('edit')}>Continue to Edit</button>
            )}

            {createStep === 'edit' && previewUrl && (
              <button type="button" className="vlxPhase4NextBtn" onClick={() => setCreateStep('details')}>Next: Caption & Publish</button>
            )}

            {message && (
              <section className={`vlxCreateMessage ${createdId ? 'success' : ''}`}>
                {message}

                {createdId && (
                  <div>
                    <a href={detailHref || `/post/${encodeURIComponent(createdId)}`}>View Published {type}</a>
                    {type === 'reel' ? <a href="/reels">Open Reels</a> : <a href="/home">Open Home</a>}
                  </div>
                )}
              </section>
            )}

            <button className="vlxCreateSubmit" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : publishLabel}
            </button>
          </form>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
