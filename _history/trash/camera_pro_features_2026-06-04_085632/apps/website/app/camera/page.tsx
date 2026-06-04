'use client'

import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'post' | 'reel' | 'story' | 'live'
type FilterName = 'original' | 'dream' | 'warm' | 'cool' | 'moody' | 'vivid'
type Ratio = '9:16' | '1:1' | '4:5' | '16:9'
type DragKey = 'text' | 'emoji' | 'location'

const MUSIC_LIBRARY = [
  'VibeLoop Dream Beat',
  'Neon Night Pulse',
  'Soft Creator Mood',
  'Royal Cinematic Drop',
  'Morning Fresh Loop',
  'Fast Reel Energy'
]

const STICKERS = ['✨', '🔥', '💫', '⭐', '❤️', '😎', '🎉', '📍', '🎵', '💎']

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

function ratioSize(ratio: Ratio) {
  if (ratio === '1:1') return { width: 1080, height: 1080 }
  if (ratio === '4:5') return { width: 1080, height: 1350 }
  if (ratio === '16:9') return { width: 1920, height: 1080 }
  return { width: 1080, height: 1920 }
}

export default function CameraPage() {
  const router = useRouter()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioChunksRef = useRef<Blob[]>([])
  const galleryRef = useRef<HTMLInputElement | null>(null)

  const [mode, setMode] = useState<Mode>('post')
  const [filter, setFilter] = useState<FilterName>('original')
  const [ratio, setRatio] = useState<Ratio>('9:16')
  const [activePanel, setActivePanel] = useState<'none' | 'tools' | 'music' | 'stickers' | 'crop'>('none')
  const [recording, setRecording] = useState(false)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const [overlayText, setOverlayText] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [locationTag, setLocationTag] = useState('')
  const [musicTitle, setMusicTitle] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [voiceUrl, setVoiceUrl] = useState('')

  const [textPos, setTextPos] = useState({ x: 50, y: 72 })
  const [emojiPos, setEmojiPos] = useState({ x: 50, y: 18 })
  const [locationPos, setLocationPos] = useState({ x: 50, y: 82 })
  const [dragKey, setDragKey] = useState<DragKey | null>(null)

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

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragKey) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(5, Math.min(95, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(8, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100))

    if (dragKey === 'text') setTextPos({ x, y })
    if (dragKey === 'emoji') setEmojiPos({ x, y })
    if (dragKey === 'location') setLocationPos({ x, y })
  }

  function drawOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.filter = 'none'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,.78)'
    ctx.shadowBlur = 18

    if (emoji.trim()) {
      ctx.font = '110px sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(emoji.trim(), (emojiPos.x / 100) * width, (emojiPos.y / 100) * height)
    }

    if (overlayText.trim()) {
      ctx.font = 'bold 74px sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(overlayText.trim(), (textPos.x / 100) * width, (textPos.y / 100) * height)
    }

    if (locationTag.trim()) {
      ctx.font = 'bold 48px sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(`📍 ${locationTag.trim()}`, (locationPos.x / 100) * width, (locationPos.y / 100) * height)
    }
  }

  async function capturePhoto() {
    const video = videoRef.current
    if (!video) return

    try {
      setBusy(true)
      setMessage('')

      const size = ratioSize(ratio)
      const canvas = document.createElement('canvas')
      canvas.width = size.width
      canvas.height = size.height

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported.')

      ctx.fillStyle = '#05050a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.filter = liveFilter || 'none'

      const scale = Math.max(canvas.width / (video.videoWidth || 1080), canvas.height / (video.videoHeight || 1920))
      const drawW = (video.videoWidth || 1080) * scale
      const drawH = (video.videoHeight || 1920) * scale
      ctx.drawImage(video, (canvas.width - drawW) / 2, (canvas.height - drawH) / 2, drawW, drawH)

      drawOverlay(ctx, canvas.width, canvas.height)

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

  async function toggleVoiceRecord() {
    try {
      if (voiceRecording) {
        audioRecorderRef.current?.stop()
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      audioRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setVoiceUrl(URL.createObjectURL(blob))
        setVoiceRecording(false)
        stream.getTracks().forEach((track) => track.stop())
        setMessage('Voice note recorded. It will continue as metadata.')
      }

      recorder.start()
      setVoiceRecording(true)
      setMessage('Voice recording started.')
    } catch (error: any) {
      setMessage(error?.message || 'Voice permission blocked.')
    }
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
        `&audioUrl=${encodeURIComponent(audioUrl || voiceUrl)}` +
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

    const video = file.type.startsWith('video/')
    setCapturedBlob(file)
    setCapturedUrl(URL.createObjectURL(file))
    setCapturedType(video ? 'video' : 'image')
    if (video) setMode('reel')
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

      <section
        className={`vlxCameraStage ratio-${ratio.replace(':', '-')}`}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragKey(null)}
        onPointerCancel={() => setDragKey(null)}
      >
        <div className="vlxCropFrame" />

        {capturedUrl ? (
          capturedType === 'video' ? (
            <video src={capturedUrl} controls playsInline className="vlxCameraMedia" />
          ) : (
            <img src={capturedUrl} alt="Captured" className="vlxCameraMedia" />
          )
        ) : (
          <video ref={videoRef} muted playsInline autoPlay className="vlxCameraMedia" style={{ filter: liveFilter }} />
        )}

        <div className="vlxCameraOverlay">
          {emoji && (
            <button
              type="button"
              className="dragEmoji"
              style={{ left: `${emojiPos.x}%`, top: `${emojiPos.y}%` }}
              onPointerDown={() => setDragKey('emoji')}
            >
              {emoji}
            </button>
          )}

          {overlayText && (
            <button
              type="button"
              className="dragText"
              style={{ left: `${textPos.x}%`, top: `${textPos.y}%` }}
              onPointerDown={() => setDragKey('text')}
            >
              {overlayText}
            </button>
          )}

          {locationTag && (
            <button
              type="button"
              className="dragLocation"
              style={{ left: `${locationPos.x}%`, top: `${locationPos.y}%` }}
              onPointerDown={() => setDragKey('location')}
            >
              📍 {locationTag}
            </button>
          )}
        </div>

        <header className="vlxCameraTop">
          <button type="button" onClick={() => router.push('/home')}>×</button>
          <button type="button" className="musicPill" onClick={() => setActivePanel('music')}>
            {musicTitle ? `♪ ${musicTitle}` : '♪ Add music'}
          </button>
          <button type="button" onClick={() => openCamera(mode)}>↻</button>
        </header>

        <aside className="vlxCameraLeftTools">
          <button type="button" onClick={() => setActivePanel('tools')}><b>T</b><span>Text</span></button>
          <button type="button" onClick={() => setActivePanel('stickers')}><b>☺</b><span>Sticker</span></button>
          <button type="button" onClick={() => setActivePanel('tools')}><b>⌖</b><span>Location</span></button>
          <button type="button" onClick={() => setActivePanel('music')}><b>♫</b><span>Music</span></button>
          <button type="button" onClick={toggleVoiceRecord}><b>{voiceRecording ? '■' : '🎙'}</b><span>Voice</span></button>
          <button type="button" onClick={() => setActivePanel('crop')}><b>⌗</b><span>Crop</span></button>
          <button type="button" onClick={() => setActivePanel('tools')}><b>✦</b><span>Adjust</span></button>
        </aside>

        <aside className="vlxCameraRightTools">
          <button type="button"><b>1x</b><span>Speed</span></button>
          <button type="button" onClick={() => setFilter('dream')}><b>✧</b><span>Beauty</span></button>
          <button type="button"><b>◷</b><span>Timer</span></button>
        </aside>

        {activePanel !== 'none' && (
          <section className="vlxCameraToolSheet">
            <div className="sheetHead">
              <b>
                {activePanel === 'music' && 'Music library'}
                {activePanel === 'stickers' && 'Stickers'}
                {activePanel === 'crop' && 'Crop & frame'}
                {activePanel === 'tools' && 'Edit tools'}
              </b>
              <button type="button" onClick={() => setActivePanel('none')}>Done</button>
            </div>

            {activePanel === 'music' && (
              <div className="vlxMusicGrid">
                {MUSIC_LIBRARY.map((item) => (
                  <button key={item} type="button" className={musicTitle === item ? 'active' : ''} onClick={() => setMusicTitle(item)}>
                    ♪ {item}
                  </button>
                ))}
                <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="Or paste audio URL..." />
              </div>
            )}

            {activePanel === 'stickers' && (
              <div className="vlxStickerGrid">
                {STICKERS.map((item) => (
                  <button key={item} type="button" onClick={() => setEmoji(item)}>{item}</button>
                ))}
              </div>
            )}

            {activePanel === 'crop' && (
              <div className="vlxRatioGrid">
                {(['9:16', '1:1', '4:5', '16:9'] as Ratio[]).map((item) => (
                  <button key={item} type="button" className={ratio === item ? 'active' : ''} onClick={() => setRatio(item)}>
                    {item}
                  </button>
                ))}
              </div>
            )}

            {activePanel === 'tools' && (
              <>
                <label>Text<input value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="Add text..." /></label>
                <label>Emoji<input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="✨" /></label>
                <label>Location<input value={locationTag} onChange={(e) => setLocationTag(e.target.value)} placeholder="Add location..." /></label>
                <label>Brightness<input type="range" min="60" max="160" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} /></label>
                <label>Contrast<input type="range" min="60" max="160" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} /></label>
                <label>Saturation<input type="range" min="40" max="180" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} /></label>
              </>
            )}
          </section>
        )}

        {message && <p className="vlxCameraMessage">{message}</p>}

        <div className="vlxCameraFilters">
          {(['original', 'dream', 'warm', 'cool', 'moody', 'vivid'] as FilterName[]).map((item) => (
            <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
              <i />
              <span>{item}</span>
            </button>
          ))}
        </div>

        <div className="vlxCameraCaptureArea">
          <button type="button" className="galleryBtn" onClick={() => galleryRef.current?.click()}>
            <span>▣</span><small>Gallery</small>
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

          <button type="button" className="effectsBtn" onClick={() => setActivePanel('tools')}>
            <span>✦</span><small>Effects</small>
          </button>
        </div>

        <nav className="vlxCameraModes">
          {(['post', 'reel', 'story', 'live'] as Mode[]).map((item) => (
            <button key={item} type="button" className={mode === item ? 'active' : ''} onClick={() => switchMode(item)}>
              {item}
            </button>
          ))}
        </nav>
      </section>
    </main>
  )
}
