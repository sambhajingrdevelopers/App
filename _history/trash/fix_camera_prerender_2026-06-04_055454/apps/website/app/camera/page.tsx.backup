'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type CameraMode = 'post' | 'reel' | 'story'
type FilterName = 'normal' | 'vivid' | 'warm' | 'cool' | 'noir' | 'vintage'

function filterCss(name: FilterName) {
  const map: Record<FilterName, string> = {
    normal: 'none',
    vivid: 'contrast(1.12) saturate(1.35)',
    warm: 'sepia(.18) saturate(1.18) hue-rotate(-8deg)',
    cool: 'saturate(1.12) hue-rotate(12deg)',
    noir: 'grayscale(1) contrast(1.2)',
    vintage: 'sepia(.35) contrast(1.08) saturate(.9)'
  }

  return map[name]
}

export default function CameraPage() {
  const router = useRouter()
  const params = useSearchParams()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [mode, setMode] = useState<CameraMode>((params.get('type') as CameraMode) || 'post')
  const [filter, setFilter] = useState<FilterName>('normal')
  const [overlayText, setOverlayText] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [capturedUrl, setCapturedUrl] = useState('')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('image')

  const isVideoMode = mode === 'reel'
  const liveFilter = useMemo(() => filterCss(filter), [filter])

  async function openCamera(nextMode = mode) {
    try {
      stopCamera(false)
      setMessage('')
      const videoMode = nextMode === 'reel'

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: videoMode
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

  function stopCamera(clear = true) {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (clear && videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    openCamera(mode)
    return () => stopCamera()
  }, [])

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

      ctx.filter = liveFilter
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      if (overlayText.trim()) {
        ctx.filter = 'none'
        ctx.font = 'bold 72px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = 'white'
        ctx.shadowColor = 'rgba(0,0,0,.65)'
        ctx.shadowBlur = 18
        ctx.fillText(overlayText.trim(), canvas.width / 2, canvas.height - 180)
      }

      if (emoji.trim()) {
        ctx.filter = 'none'
        ctx.font = '110px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(emoji.trim(), canvas.width / 2, 160)
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((file) => file ? resolve(file) : reject(new Error('Capture failed.')), 'image/jpeg', 0.92)
      })

      const localUrl = URL.createObjectURL(blob)
      setCapturedBlob(blob)
      setCapturedUrl(localUrl)
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
      const localUrl = URL.createObjectURL(blob)
      setCapturedBlob(blob)
      setCapturedUrl(localUrl)
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
    link.download = capturedType === 'video' ? `vibeloop-${Date.now()}.webm` : `vibeloop-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    link.remove()

    setMessage('Saved to phone downloads. Gallery auto-save needs native Android app.')
  }

  async function continueToEditor() {
    if (!capturedBlob) {
      setMessage('Capture photo/video first.')
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

      const url = `/create?type=${encodeURIComponent(finalMode)}&fromCamera=1&mediaType=${capturedType}&mediaUrl=${encodeURIComponent(mediaUrl)}&videoUrl=${encodeURIComponent(videoUrl)}`
      router.push(url)
    } catch (error: any) {
      setMessage(error?.message || 'Could not continue.')
    } finally {
      setBusy(false)
    }
  }

  function changeMode(next: CameraMode) {
    setMode(next)
    setCapturedBlob(null)
    setCapturedUrl('')
    setCapturedType(next === 'reel' ? 'video' : 'image')
    openCamera(next)
  }

  return (
    <main className="vlxSnapCameraPage">
      <section className="vlxSnapCameraView">
        {capturedUrl ? (
          capturedType === 'video' ? (
            <video src={capturedUrl} controls playsInline className="vlxSnapCameraMedia" />
          ) : (
            <img src={capturedUrl} alt="Captured" className="vlxSnapCameraMedia" />
          )
        ) : (
          <video ref={videoRef} muted playsInline autoPlay className="vlxSnapCameraMedia" style={{ filter: liveFilter }} />
        )}

        {!capturedUrl && (
          <div className="vlxSnapOverlay">
            {emoji && <span>{emoji}</span>}
            {overlayText && <b>{overlayText}</b>}
          </div>
        )}

        <header className="vlxSnapTop">
          <button type="button" onClick={() => router.push('/home')}>‹</button>
          <strong>Camera</strong>
          <button type="button" onClick={() => openCamera(mode)}>↻</button>
        </header>

        <div className="vlxSnapModes">
          <button className={mode === 'post' ? 'active' : ''} onClick={() => changeMode('post')}>Post</button>
          <button className={mode === 'reel' ? 'active' : ''} onClick={() => changeMode('reel')}>Reel</button>
          <button className={mode === 'story' ? 'active' : ''} onClick={() => changeMode('story')}>Story</button>
        </div>

        <div className="vlxSnapFilters">
          {(['normal','vivid','warm','cool','noir','vintage'] as FilterName[]).map((item) => (
            <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="vlxSnapInputs">
          <input value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="Add text..." />
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" />
        </div>

        <div className="vlxSnapCaptureBar">
          {capturedUrl ? (
            <>
              <button type="button" onClick={() => { setCapturedUrl(''); setCapturedBlob(null); openCamera(mode) }}>Retake</button>
              <button type="button" onClick={saveToPhone}>Save</button>
              <button type="button" onClick={continueToEditor} disabled={busy}>Edit</button>
            </>
          ) : isVideoMode ? (
            <>
              <button type="button" onClick={recording ? stopRecording : startRecording} className={recording ? 'recording' : ''}>
                {recording ? 'Stop' : 'Record'}
              </button>
            </>
          ) : (
            <button type="button" onClick={capturePhoto} disabled={busy} className="shutter">●</button>
          )}
        </div>

        {message && <p className="vlxSnapMessage">{message}</p>}
      </section>
    </main>
  )
}
