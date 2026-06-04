'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'post' | 'reel' | 'story' | 'live'
type FilterName = 'original' | 'dream' | 'warm' | 'cool' | 'moody' | 'vivid'
type Ratio = '9:16' | '1:1' | '4:5' | '16:9'

function getFilter(name: FilterName, brightness: number, contrast: number, saturation: number) {
  const base: Record<FilterName, string> = {
    original: '',
    dream: 'contrast(1.05) saturate(1.28) hue-rotate(8deg)',
    warm: 'sepia(.18) saturate(1.18) hue-rotate(-8deg)',
    cool: 'saturate(1.14) hue-rotate(14deg)',
    moody: 'contrast(1.18) saturate(.82) brightness(.9)',
    vivid: 'contrast(1.15) saturate(1.45)'
  }

  return `${base[name]} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`.trim()
}

export default function CameraPage() {
  const router = useRouter()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const galleryRef = useRef<HTMLInputElement | null>(null)

  const [mode, setMode] = useState<Mode>('post')
  const [filter, setFilter] = useState<FilterName>('original')
  const [ratio, setRatio] = useState<Ratio>('9:16')
  const [showTools, setShowTools] = useState(false)
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const [overlayText, setOverlayText] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [locationTag, setLocationTag] = useState('')
  const [musicTitle, setMusicTitle] = useState('')
  const [audioUrl, setAudioUrl] = useState('')

  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)

  const [capturedUrl, setCapturedUrl] = useState('')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('image')

  const liveFilter = useMemo(
    () => getFilter(filter, brightness, contrast, saturation),
    [filter, brightness, contrast, saturation]
  )

  function isVideoMode(nextMode = mode) {
    return nextMode === 'reel' || nextMode === 'live'
  }

  function stopCamera(clear = false) {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (clear && videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  async function openCamera(nextMode = mode) {
    try {
      stopCamera()
      setMessage('')

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: isVideoMode(nextMode)
      })

      streamRef.current = stream

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => undefined)
        }
      }, 80)
    } catch (error: any) {
      setMessage(error?.message || 'Camera permission blocked.')
    }
  }

  useEffect(() => {
    document.documentElement.classList.add('vlxCameraStudioRoot')
    document.body.classList.add('vlxCameraStudioBody')

    const query = new URLSearchParams(window.location.search)
    const requested = query.get('type')
    const nextMode: Mode =
      requested === 'reel' || requested === 'story' || requested === 'live' || requested === 'post'
        ? requested
        : 'post'

    setMode(nextMode)
    setCapturedType(isVideoMode(nextMode) ? 'video' : 'image')
    openCamera(nextMode)

    return () => {
      stopCamera(true)
      document.documentElement.classList.remove('vlxCameraStudioRoot')
      document.body.classList.remove('vlxCameraStudioBody')
    }
  }, [])

  function switchMode(next: Mode) {
    setMode(next)
    setCapturedUrl('')
    setCapturedBlob(null)
    setCapturedType(isVideoMode(next) ? 'video' : 'image')
    openCamera(next)
  }

  async function capturePhoto() {
    const video = videoRef.current
    if (!video) return

    try {
      setBusy(true)
      setMessage('')

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1080
      canvas.height = video.videoHeight || 1920

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported.')

      ctx.filter = liveFilter || 'none'
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      ctx.filter = 'none'
      ctx.textAlign = 'center'
      ctx.shadowColor = 'rgba(0,0,0,.75)'
      ctx.shadowBlur = 18

      if (emoji.trim()) {
        ctx.font = '110px sans-serif'
        ctx.fillStyle = 'white'
        ctx.fillText(emoji.trim(), canvas.width / 2, 150)
      }

      if (overlayText.trim()) {
        ctx.font = 'bold 74px sans-serif'
        ctx.fillStyle = 'white'
        ctx.fillText(overlayText.trim(), canvas.width / 2, canvas.height - 220)
      }

      if (locationTag.trim()) {
        ctx.font = 'bold 48px sans-serif'
        ctx.fillStyle = 'white'
        ctx.fillText(`📍 ${locationTag.trim()}`, canvas.width / 2, canvas.height - 130)
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((file) => file ? resolve(file) : reject(new Error('Capture failed.')), 'image/jpeg', 0.92)
      })

      setCapturedBlob(blob)
      setCapturedUrl(URL.createObjectURL(blob))
      setCapturedType('image')
      setMessage('Photo captured. Save or continue to edit.')
    } catch (error: any) {
      setMessage(error?.message || 'Photo capture failed.')
    } finally {
      setBusy(false)
    }
  }

  function startRecording() {
    const stream = streamRef.current

    if (!stream || typeof MediaRecorder === 'undefined') {
      setMessage('Video recording not supported in this browser.')
      return
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setCapturedBlob(blob)
      setCapturedUrl(URL.createObjectURL(blob))
      setCapturedType('video')
      setRecording(false)
      setMessage('Video recorded. Save or continue to edit.')
    }

    recorder.start()
    setRecording(true)
    setMessage('Recording started.')
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  function saveToPhone() {
    if (!capturedBlob || !capturedUrl) {
      setMessage('Capture photo/video first.')
      return
    }

    const link = document.createElement('a')
    link.href = capturedUrl
    link.download = capturedType === 'video' ? `vibeloop-video-${Date.now()}.webm` : `vibeloop-photo-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    link.remove()

    setMessage('Saved to downloads. Direct gallery save needs Android app.')
  }

  async function uploadAndContinue() {
    if (!capturedBlob) {
      setMessage('Capture or select media first.')
      return
    }

    try {
      setBusy(true)
      setMessage('Uploading media...')

      const fileName = capturedType === 'video' ? `camera-${Date.now()}.webm` : `camera-${Date.now()}.jpg`
      const file = new File([capturedBlob], fileName, { type: capturedBlob.type })
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

      const mediaUrl = data.mediaUrl || data.url || ''
      const videoUrl = capturedType === 'video' ? (data.videoUrl || mediaUrl) : ''
      const finalMode = capturedType === 'video' ? 'reel' : mode

      const url =
        `/create?type=${encodeURIComponent(finalMode)}` +
        `&fromCamera=1` +
        `&mediaType=${encodeURIComponent(capturedType)}` +
        `&mediaUrl=${encodeURIComponent(mediaUrl)}` +
        `&videoUrl=${encodeURIComponent(videoUrl)}` +
        `&location=${encodeURIComponent(locationTag)}` +
        `&musicTitle=${encodeURIComponent(musicTitle)}` +
        `&audioUrl=${encodeURIComponent(audioUrl)}` +
        `&cropRatio=${encodeURIComponent(ratio)}`

      router.push(url)
    } catch (error: any) {
      setMessage(error?.message || 'Could not continue.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGallery(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    setCapturedBlob(file)
    setCapturedUrl(URL.createObjectURL(file))
    setCapturedType(isVideo ? 'video' : 'image')
    setMode(isVideo ? 'reel' : mode)
    setMessage('Gallery media ready. Save or continue to edit.')
  }

  return (
    <main className="vlxCameraStudio">
      <input
        ref={galleryRef}
        className="vlxCameraHiddenInput"
        type="file"
        accept="image/*,video/*"
        onChange={(event) => handleGallery(event.target.files)}
      />

      <section className="vlxCameraStage">
        {capturedUrl ? (
          capturedType === 'video' ? (
            <video src={capturedUrl} controls playsInline className="vlxCameraMedia" />
          ) : (
            <img src={capturedUrl} alt="Captured" className="vlxCameraMedia" />
          )
        ) : (
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="vlxCameraMedia"
            style={{ filter: liveFilter }}
          />
        )}

        {!capturedUrl && (
          <div className="vlxCameraOverlay">
            {emoji && <span>{emoji}</span>}
            {overlayText && <b>{overlayText}</b>}
            {locationTag && <em>📍 {locationTag}</em>}
          </div>
        )}

        <header className="vlxCameraTop">
          <button type="button" onClick={() => router.push('/home')}>×</button>
          <button type="button" className="musicPill" onClick={() => setShowTools(true)}>♪ Add music</button>
          <button type="button" onClick={() => openCamera(mode)}>↻</button>
        </header>

        <aside className="vlxCameraLeftTools">
          <button type="button" onClick={() => setShowTools(true)}><b>T</b><span>Text</span></button>
          <button type="button" onClick={() => setShowTools(true)}><b>☺</b><span>Sticker</span></button>
          <button type="button" onClick={() => setShowTools(true)}><b>⌖</b><span>Location</span></button>
          <button type="button" onClick={() => setShowTools(true)}><b>♫</b><span>Music</span></button>
          <button type="button" onClick={() => setShowTools(true)}><b>🎙</b><span>Voice</span></button>
          <button type="button" onClick={() => setShowTools(true)}><b>⌗</b><span>Crop</span></button>
          <button type="button" onClick={() => setShowTools(true)}><b>✦</b><span>Adjust</span></button>
        </aside>

        <aside className="vlxCameraRightTools">
          <button type="button"><b>1x</b><span>Speed</span></button>
          <button type="button" onClick={() => setFilter('dream')}><b>✧</b><span>Beauty</span></button>
          <button type="button"><b>◷</b><span>Timer</span></button>
        </aside>

        {showTools && (
          <section className="vlxCameraToolSheet">
            <div className="sheetHead">
              <b>Edit tools</b>
              <button type="button" onClick={() => setShowTools(false)}>Done</button>
            </div>

            <label>
              Text
              <input value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="Add text..." />
            </label>

            <label>
              Emoji / Sticker
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="✨" />
            </label>

            <label>
              Location
              <input value={locationTag} onChange={(e) => setLocationTag(e.target.value)} placeholder="Add location..." />
            </label>

            <label>
              Music title
              <input value={musicTitle} onChange={(e) => setMusicTitle(e.target.value)} placeholder="Song name..." />
            </label>

            <label>
              Voice / audio URL
              <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="Paste audio URL..." />
            </label>

            <label>
              Crop ratio
              <select value={ratio} onChange={(e) => setRatio(e.target.value as Ratio)}>
                <option value="9:16">9:16 Reel / Story</option>
                <option value="1:1">1:1 Square</option>
                <option value="4:5">4:5 Post</option>
                <option value="16:9">16:9 Wide</option>
              </select>
            </label>

            <label>
              Brightness
              <input type="range" min="60" max="160" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
            </label>

            <label>
              Contrast
              <input type="range" min="60" max="160" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
            </label>

            <label>
              Saturation
              <input type="range" min="40" max="180" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} />
            </label>
          </section>
        )}

        {message && <p className="vlxCameraMessage">{message}</p>}

        <div className="vlxCameraFilters">
          {(['original', 'dream', 'warm', 'cool', 'moody', 'vivid'] as FilterName[]).map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? 'active' : ''}
              onClick={() => setFilter(item)}
            >
              <i />
              <span>{item}</span>
            </button>
          ))}
        </div>

        <div className="vlxCameraCaptureArea">
          <button type="button" className="galleryBtn" onClick={() => galleryRef.current?.click()}>
            <span>▣</span>
            <small>Gallery</small>
          </button>

          {capturedUrl ? (
            <div className="capturedActions">
              <button type="button" onClick={() => { setCapturedUrl(''); setCapturedBlob(null); openCamera(mode) }}>Retake</button>
              <button type="button" onClick={saveToPhone}>Save</button>
              <button type="button" onClick={uploadAndContinue} disabled={busy}>Edit</button>
            </div>
          ) : isVideoMode() ? (
            <button type="button" className={recording ? 'shutter recording' : 'shutter'} onClick={recording ? stopRecording : startRecording}>
              {recording ? '■' : '●'}
            </button>
          ) : (
            <button type="button" className="shutter" onClick={capturePhoto} disabled={busy}>●</button>
          )}

          <button type="button" className="effectsBtn" onClick={() => setShowTools(true)}>
            <span>✦</span>
            <small>Effects</small>
          </button>
        </div>

        <nav className="vlxCameraModes">
          {(['post', 'reel', 'story', 'live'] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              className={mode === item ? 'active' : ''}
              onClick={() => switchMode(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </section>
    </main>
  )
}
