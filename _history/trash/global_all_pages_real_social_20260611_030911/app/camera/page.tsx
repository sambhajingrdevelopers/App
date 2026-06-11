'use client'


function vlxRememberMedia(url: any, type: any = "image") {
  try {
    const clean = String(url || "").trim()
    if (!clean) return
    sessionStorage.setItem("vlx_create_media_url", clean)
    sessionStorage.setItem("vlx_create_media_type", String(type || "image"))
    sessionStorage.setItem("vlx_create_media_time", String(Date.now()))
  } catch {}
}



function backendMediaUrl(url: string) {
  if (!url) return ""
  if (url.startsWith("http")) return url
  if (url.startsWith("/media/")) return url
  return url
}


function cleanCameraError(value: any) {
  const text = String(value || '').trim()
  if (!text) return 'Something went wrong.'
  if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('__next_f.push') || text.length > 220) {
    return 'HD route not deployed yet. Wait for Vercel deploy, then retry.'
  }
  return text
}
import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'post' | 'reel' | 'story' | 'live'
type FilterName = 'original' | 'dream' | 'warm' | 'cool' | 'moody' | 'vivid'
type Ratio = '9:16' | '1:1' | '4:5' | '16:9'
type DragKey = 'text' | 'emoji' | 'location'
type Facing = 'environment' | 'user'
type Panel = 'none' | 'tools' | 'music' | 'stickers' | 'crop' | 'pen'

const MUSIC_LIBRARY = [
  'VibeLoop Dream Beat',
  'Neon Night Pulse',
  'Soft Creator Mood',
  'Royal Cinematic Drop',
  'Morning Fresh Loop',
  'Fast Reel Energy'
]

const STICKERS = ['✨', '🔥', '💫', '⭐', '❤️', '😎', '🎉', '📍', '🎵', '💎', '👑', '⚡']
const TEXT_COLORS = ['#ffffff', '#ff2fb4', '#00c8ff', '#ffec4a', '#40ff8a', '#ff7a1a']

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

// VIBELOOP_HD_ENHANCE_ENGINE
function clampByte(value: number) {
  return Math.max(0, Math.min(255, value))
}

// VIBELOOP_ANTI_BLUR_CAPTURE_ENGINE
function waitAntiBlur(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function drawVideoCoverFrame(video: HTMLVideoElement, ctx: CanvasRenderingContext2D, width: number, height: number, filter: string) {
  ctx.fillStyle = '#05050a'
  ctx.fillRect(0, 0, width, height)
  ctx.filter = filter || 'none'

  const vw = video.videoWidth || 1080
  const vh = video.videoHeight || 1920
  const scale = Math.max(width / vw, height / vh)
  const drawW = vw * scale
  const drawH = vh * scale

  ctx.drawImage(video, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH)
}

function frameSharpnessScore(canvas: HTMLCanvasElement) {
  const small = document.createElement('canvas')
  const w = 180
  const h = Math.max(120, Math.round((canvas.height / canvas.width) * w))
  small.width = w
  small.height = h

  const c = small.getContext('2d')
  if (!c) return 0

  c.drawImage(canvas, 0, 0, w, h)
  const img = c.getImageData(0, 0, w, h).data

  let score = 0
  let count = 0

  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const i = (y * w + x) * 4
      const l = (img[i] + img[i + 1] + img[i + 2]) / 3

      const ir = (y * w + (x + 1)) * 4
      const ib = ((y + 1) * w + x) * 4

      const lr = (img[ir] + img[ir + 1] + img[ir + 2]) / 3
      const lb = (img[ib] + img[ib + 1] + img[ib + 2]) / 3

      score += Math.abs(l - lr) + Math.abs(l - lb)
      count++
    }
  }

  return count ? score / count : 0
}

async function drawBestAntiBlurFrame(
  video: HTMLVideoElement,
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: string,
  enabled: boolean
) {
  const frames = enabled ? 5 : 1
  let bestCanvas: HTMLCanvasElement | null = null
  let bestScore = -1

  for (let i = 0; i < frames; i++) {
    if (i > 0) await waitAntiBlur(90)

    const temp = document.createElement('canvas')
    temp.width = width
    temp.height = height

    const tempCtx = temp.getContext('2d')
    if (!tempCtx) continue

    drawVideoCoverFrame(video, tempCtx, width, height, filter)

    const score = frameSharpnessScore(temp)
    if (score > bestScore) {
      bestScore = score
      bestCanvas = temp
    }
  }

  if (bestCanvas) {
    targetCtx.filter = 'none'
    targetCtx.drawImage(bestCanvas, 0, 0, width, height)
  } else {
    drawVideoCoverFrame(video, targetCtx, width, height, filter)
  }
}



function applySharpen(data: ImageData, strength: number) {
  if (strength <= 0) return data

  const w = data.width
  const h = data.height
  const src = new Uint8ClampedArray(data.data)
  const dst = data.data
  const amount = strength / 100

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4

      for (let c = 0; c < 3; c++) {
        const center = src[i + c] * (1 + 4 * amount)
        const top = src[((y - 1) * w + x) * 4 + c] * amount
        const bottom = src[((y + 1) * w + x) * 4 + c] * amount
        const left = src[(y * w + (x - 1)) * 4 + c] * amount
        const right = src[(y * w + (x + 1)) * 4 + c] * amount
        dst[i + c] = clampByte(center - top - bottom - left - right)
      }
    }
  }

  return data
}

function applyDenoise(data: ImageData, strength: number) {
  if (strength <= 0) return data

  const w = data.width
  const h = data.height
  const src = new Uint8ClampedArray(data.data)
  const dst = data.data
  const blend = Math.min(0.72, strength / 160)

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4

      for (let c = 0; c < 3; c++) {
        const avg =
          (
            src[((y - 1) * w + x) * 4 + c] +
            src[((y + 1) * w + x) * 4 + c] +
            src[(y * w + (x - 1)) * 4 + c] +
            src[(y * w + (x + 1)) * 4 + c] +
            src[i + c]
          ) / 5

        dst[i + c] = clampByte(src[i + c] * (1 - blend) + avg * blend)
      }
    }
  }

  return data
}

function applyClarity(data: ImageData, clarity: number, glow: number) {
  const d = data.data
  const c = clarity / 100
  const g = glow / 100

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const gg = d[i + 1]
    const b = d[i + 2]
    const lum = (r + gg + b) / 3

    d[i] = clampByte(r + (r - lum) * c + 10 * g)
    d[i + 1] = clampByte(gg + (gg - lum) * c + 8 * g)
    d[i + 2] = clampByte(b + (b - lum) * c + 5 * g)
  }

  return data
}

function enhanceCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, options: {
  hd: boolean
  sharpness: number
  denoise: number
  clarity: number
  faceGlow: number
}) {
  if (!options.hd) return

  try {
    let image = ctx.getImageData(0, 0, width, height)
    image = applyDenoise(image, options.denoise)
    image = applyClarity(image, options.clarity, options.faceGlow)
    image = applySharpen(image, options.sharpness)
    ctx.putImageData(image, 0, 0)
  } catch {
    // Canvas enhancement skipped safely.
  }
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
  const [facing, setFacing] = useState<Facing>('environment')
  const [filter, setFilter] = useState<FilterName>('original')
  const [ratio, setRatio] = useState<Ratio>('9:16')
  const [activePanel, setActivePanel] = useState<Panel>('none')
  const [recording, setRecording] = useState(false)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [flash, setFlash] = useState(false)
  const [grid, setGrid] = useState(true)
  const [antiBlurMode, setAntiBlurMode] = useState(true)
  const [timerSec, setTimerSec] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [aiHdLoading, setAiHdLoading] = useState(false)
  const [processingVideo, setProcessingVideo] = useState(false)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [muteOriginal, setMuteOriginal] = useState(false)
  const [audioVolume, setAudioVolume] = useState(75)
  const [coverAt, setCoverAt] = useState(1)
  const [enhancing, setEnhancing] = useState(false)
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

  const [textColor, setTextColor] = useState('#ffffff')
  const [textSize, setTextSize] = useState(38)
  const [stickerSize, setStickerSize] = useState(74)

  const [penMode, setPenMode] = useState(false)
  const [penColor, setPenColor] = useState('#ff2fb4')
  const [paths, setPaths] = useState<{ color: string; points: { x: number; y: number }[] }[]>([])

  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [hdEnhance, setHdEnhance] = useState(true)
  const [sharpness, setSharpness] = useState(42)
  const [denoise, setDenoise] = useState(24)
  const [clarity, setClarity] = useState(38)
  const [faceGlow, setFaceGlow] = useState(18)
  const [lowLightBoost, setLowLightBoost] = useState(0)

  const [capturedUrl, setCapturedUrl] = useState('')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('image')

  const liveFilter = useMemo(
    () => {
      const boostBrightness = hdEnhance ? brightness + lowLightBoost : brightness
      const boostContrast = hdEnhance ? contrast + Math.round(clarity / 4) : contrast
      const boostSaturation = hdEnhance ? saturation + 8 : saturation
      return getFilter(filter, boostBrightness, boostContrast, boostSaturation)
    },
    [filter, brightness, contrast, saturation, hdEnhance, lowLightBoost, clarity]
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

  async function openCamera(nextMode = mode, nextFacing = facing) {
    try {
      stopCamera()
      setMessage('')

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },},
        audio: isVideoMode(nextMode)
      })

      streamRef.current = stream

      // VIBELOOP_AUTO_FOCUS_EXPOSURE
      try {
        const track = stream.getVideoTracks()[0]
        if (track?.applyConstraints) {
          await track.applyConstraints({
            advanced: [
              {
                focusMode: 'continuous',
                exposureMode: 'continuous',
                whiteBalanceMode: 'continuous'
              } as any
            ]
          } as MediaTrackConstraints)
        }
      } catch {
        // Some mobile browsers do not expose focus/exposure controls.
      }

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

  async function toggleFlash() {
    const next = !flash
    setFlash(next)

    try {
      const track = streamRef.current?.getVideoTracks()?.[0]
      if (track) {
        await track.applyConstraints({ advanced: [{ torch: next } as any] } as MediaTrackConstraints)
      }
    } catch {
      setMessage('Flash not supported on this device/browser.')
    }
  }

  function flipCamera() {
    const next: Facing = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    openCamera(mode, next)
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

  function getPercent(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
    return { x, y }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!penMode) return
    const point = getPercent(event)
    setPaths((prev) => [...prev, { color: penColor, points: [point] }])
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (penMode && event.buttons === 1) {
      const point = getPercent(event)
      setPaths((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last) last.points = [...last.points, point]
        return next
      })
      return
    }

    if (!dragKey) return

    const point = getPercent(event)
    const x = Math.max(5, Math.min(95, point.x))
    const y = Math.max(8, Math.min(92, point.y))

    if (dragKey === 'text') setTextPos({ x, y })
    if (dragKey === 'emoji') setEmojiPos({ x, y })
    if (dragKey === 'location') setLocationPos({ x, y })
  }

  function drawPaths(ctx: CanvasRenderingContext2D, width: number, height: number) {
    paths.forEach((path) => {
      if (path.points.length < 2) return
      ctx.strokeStyle = path.color
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      path.points.forEach((pt, index) => {
        const x = (pt.x / 100) * width
        const y = (pt.y / 100) * height
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    })
  }

  function drawOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    drawPaths(ctx, width, height)

    ctx.filter = 'none'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,.78)'
    ctx.shadowBlur = 18

    if (emoji.trim()) {
      ctx.font = `${stickerSize}px sans-serif`
      ctx.fillStyle = 'white'
      ctx.fillText(emoji.trim(), (emojiPos.x / 100) * width, (emojiPos.y / 100) * height)
    }

    if (overlayText.trim()) {
      ctx.font = `bold ${textSize}px sans-serif`
      ctx.fillStyle = textColor
      ctx.fillText(overlayText.trim(), (textPos.x / 100) * width, (textPos.y / 100) * height)
    }

    if (locationTag.trim()) {
      ctx.font = 'bold 48px sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(`📍 ${locationTag.trim()}`, (locationPos.x / 100) * width, (locationPos.y / 100) * height)
    }
  }

  async function waitTimer() {
    if (!timerSec) return

    for (let i = timerSec; i > 0; i--) {
      setCountdown(i)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setCountdown(0)
  }

  async function capturePhoto() {
    const video = videoRef.current
    if (!video) return

    try {
      setBusy(true)
      setMessage('')
      await waitTimer()

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
      await drawBestAntiBlurFrame(video, ctx, canvas.width, canvas.height, liveFilter, antiBlurMode)

      enhanceCanvas(ctx, canvas.width, canvas.height, {
        hd: hdEnhance,
        sharpness,
        denoise,
        clarity,
        faceGlow
      })

      drawOverlay(ctx, canvas.width, canvas.height)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((file) => file ? resolve(file) : reject(new Error('Capture failed.')), 'image/jpeg', 0.92)
      })

      setCapturedBlob(blob)
      const vlxObjectUrl = URL.createObjectURL(blob)
      setCapturedUrl(vlxObjectUrl)
      vlxRememberMedia(vlxObjectUrl, capturedType || 'image')
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
      const vlxObjectUrl = URL.createObjectURL(blob)
      setCapturedUrl(vlxObjectUrl)
      vlxRememberMedia(vlxObjectUrl, capturedType || 'image')
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
        setMessage('Voice note recorded.')
      }

      recorder.start()
      setVoiceRecording(true)
      setMessage('Voice recording started.')
    } catch (error: any) {
      setMessage(error?.message || 'Voice permission blocked.')
    }
  }

  async function enhanceCapturedMedia() {
    if (!capturedBlob) {
      setMessage('Capture photo/video first.')
      return
    }

    try {
      setEnhancing(true)
      setMessage('VibeLoop HD Enhance processing...')

      const isVideo = capturedType === 'video'
      const fileName = isVideo ? `vibeloop-hd-${Date.now()}.webm` : `vibeloop-hd-${Date.now()}.jpg`
      const file = new File([capturedBlob], fileName, { type: capturedBlob.type })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('sharpness', String(typeof sharpness !== 'undefined' ? sharpness : 45))
      formData.append('denoise', String(typeof denoise !== 'undefined' ? denoise : 24))
      formData.append('clarity', String(typeof clarity !== 'undefined' ? clarity : 38))
      formData.append('faceGlow', String(typeof faceGlow !== 'undefined' ? faceGlow : 18))
      formData.append('lowLightBoost', String(typeof lowLightBoost !== 'undefined' ? lowLightBoost : 0))

      const response = await fetch('/api/v1/media/enhance', {
        method: 'POST',
        body: formData
      })

      const rawText = await response.text()
      let data: any = {}

      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        throw new Error(rawText || 'HD enhance backend returned empty response.')
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'HD enhance failed.')
      }

      const enhancedMediaUrl = data.mediaUrl || data.url || ''
      const proxyUrl = `/api/media/proxy?url=${encodeURIComponent(enhancedMediaUrl)}`

      const enhancedResponse = await fetch(proxyUrl, { cache: 'no-store' })
      const enhancedType = enhancedResponse.headers.get('content-type') || ''

      if (!enhancedResponse.ok || enhancedType.includes('text/html') || enhancedType.includes('application/json')) {
        setCapturedUrl(proxyUrl)
        vlxRememberMedia(proxyUrl, 'image')
        setCapturedType('image')
        setMessage('HD completed. Preview loaded from enhanced media URL.')
        return
      }

      const enhancedBlob = await enhancedResponse.blob()

      setCapturedBlob(enhancedBlob)
      const vlxObjectUrl = URL.createObjectURL(enhancedBlob)
      setCapturedUrl(vlxObjectUrl)
      vlxRememberMedia(vlxObjectUrl, capturedType || 'image')
      setCapturedType(data.mediaType === 'video' ? 'video' : capturedType)

      setMessage('HD Enhance completed. Now save or continue edit.')
    } catch (error: any) {
      setMessage(cleanCameraError(error?.message || 'HD Enhance failed.'))
    } finally {
      setEnhancing(false)
    }
  }


  async function processCapturedVideo() {
    if (!capturedBlob || capturedType !== 'video') {
      setMessage('Record or select video first.')
      return
    }

    try {
      setProcessingVideo(true)
      setMessage('Processing video: trim, cover and audio mix...')

      const videoFile = new File(
        [capturedBlob],
        `vibeloop-video-${Date.now()}.webm`,
        { type: capturedBlob.type || 'video/webm' }
      )

      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('trimStart', String(trimStart || 0))
      formData.append('trimEnd', String(trimEnd || 0))
      formData.append('muteOriginal', String(muteOriginal))
      formData.append('audioVolume', String((audioVolume || 75) / 100))
      formData.append('originalVolume', String(muteOriginal ? 0 : 1))
      formData.append('coverAt', String(coverAt || 1))

      const audioSource = String(audioUrl || voiceUrl || '').trim()

      if (audioSource) {
        try {
          const audioResponse = await fetch(audioSource)
          const audioBlob = await audioResponse.blob()
          const audioFile = new File(
            [audioBlob],
            `vibeloop-audio-${Date.now()}.webm`,
            { type: audioBlob.type || 'audio/webm' }
          )
          formData.append('audio', audioFile)
        } catch {
          setMessage('Audio URL could not be loaded. Processing video without audio mix...')
        }
      }

      const response = await fetch('/api/media/process-video', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Video processing failed.')
      }

      const finalUrl = data.videoUrl || data.mediaUrl || data.url
      const proxyUrl = `/api/media/proxy?url=${encodeURIComponent(finalUrl)}`

      const processedResponse = await fetch(proxyUrl, { cache: 'no-store' })
      const processedBlob = await processedResponse.blob()

      setCapturedBlob(processedBlob)
      const vlxObjectUrl = URL.createObjectURL(processedBlob)
      setCapturedUrl(vlxObjectUrl)
      vlxRememberMedia(vlxObjectUrl, capturedType || 'image')
      setCapturedType('video')

      setMessage('Video processed successfully. Now Save or Edit.')
    } catch (error: any) {
      setMessage(cleanCameraError(error?.message || 'Video processing failed.'))
    } finally {
      setProcessingVideo(false)
    }
  }


  async function aiPhotoHdEnhance() {
    if (!capturedBlob || capturedType !== 'image') {
      setMessage('AI HD is for photos only. Use normal HD/video process for video.')
      return
    }

    try {
      setAiHdLoading(true)
      setMessage('AI HD processing with Real-ESRGAN + GFPGAN... CPU server may take time.')

      const photoFile = new File(
        [capturedBlob],
        `vibeloop-ai-photo-${Date.now()}.jpg`,
        { type: capturedBlob.type || 'image/jpeg' }
      )

      const formData = new FormData()
      formData.append('file', photoFile)
      formData.append('scale', '2')
      formData.append('faceRestore', 'true')

      const response = await fetch('/api/ai/photo-hd', {
        method: 'POST',
        body: formData
      })

      const rawText = await response.text()
      let data: any = {}

      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        throw new Error('AI HD route returned HTML/404 instead of JSON.')
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'AI HD failed.')
      }

      const aiUrl = data.mediaUrl || data.url || ''
      const proxyUrl = backendMediaUrl(aiUrl)

      const aiResponse = await fetch(proxyUrl, { cache: 'no-store' })
      const aiType = aiResponse.headers.get('content-type') || ''

      if (!aiResponse.ok || aiType.includes('text/html') || aiType.includes('application/json')) {
        throw new Error('AI HD image created but preview fetch failed. Save/Edit may still work after deploy refresh.')
      }

      const aiBlob = await aiResponse.blob()

      setCapturedBlob(aiBlob)
      const vlxObjectUrl = URL.createObjectURL(aiBlob)
      setCapturedUrl(vlxObjectUrl)
      vlxRememberMedia(vlxObjectUrl, capturedType || 'image')
      setCapturedType('image')
      setMessage('AI HD completed. Now Save or Edit.')
    } catch (error: any) {
      setMessage(cleanCameraError(error?.message || 'AI HD failed.'))
    } finally {
      setAiHdLoading(false)
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
      setMessage(cleanCameraError(error?.message || 'Could not continue.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleGallery(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return

    const video = file.type.startsWith('video/')
    setCapturedBlob(file)
    const vlxObjectUrl = URL.createObjectURL(file)
      setCapturedUrl(vlxObjectUrl)
      vlxRememberMedia(vlxObjectUrl, capturedType || 'image')
    setCapturedType(video ? 'video' : 'image')
    if (video) setMode('reel')
    setMessage('Gallery media ready. Save or continue to edit.')
  }

  return (
    <main className="vlxCameraStudio">
      <input ref={galleryRef} className="vlxCameraHiddenInput" type="file" accept="image/*,video/*" onChange={(event) => handleGallery(event.target.files)} />

      <section
        className={`vlxCameraStage ratio-${ratio.replace(':', '-')} ${grid ? 'gridOn' : ''} ${penMode ? 'penOn' : ''}`}
        onPointerDown={onPointerDown}
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

        {countdown > 0 && <div className="vlxCountdown">{countdown}</div>}

        <svg className="vlxPenLayer" viewBox="0 0 100 100" preserveAspectRatio="none">
          {paths.map((path, index) => (
            <polyline key={index} points={path.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={path.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>

        <div className="vlxCameraOverlay">
          {emoji && <button type="button" className="dragEmoji" style={{ left: `${emojiPos.x}%`, top: `${emojiPos.y}%`, fontSize: stickerSize }} onPointerDown={() => setDragKey('emoji')}>{emoji}</button>}
          {overlayText && <button type="button" className="dragText" style={{ left: `${textPos.x}%`, top: `${textPos.y}%`, color: textColor, fontSize: textSize }} onPointerDown={() => setDragKey('text')}>{overlayText}</button>}
          {locationTag && <button type="button" className="dragLocation" style={{ left: `${locationPos.x}%`, top: `${locationPos.y}%` }} onPointerDown={() => setDragKey('location')}>📍 {locationTag}</button>}
        </div>

        <header className="vlxCameraTop">
          <button type="button" onClick={() => router.push('/home')}>×</button>
          <button type="button" className="musicPill" onClick={() => setActivePanel('music')}>{musicTitle ? `♪ ${musicTitle}` : '♪ Add music'}</button>
          <button type="button" onClick={flipCamera}>⇄</button>
        </header>

        <aside className="vlxCameraLeftTools">
          <button type="button" onClick={() => setActivePanel('tools')}><b>T</b><span>Text</span></button>
          <button type="button" onClick={() => setActivePanel('stickers')}><b>☺</b><span>Sticker</span></button>
          <button type="button" onClick={() => setActivePanel('tools')}><b>⌖</b><span>Location</span></button>
          <button type="button" onClick={() => setActivePanel('music')}><b>♫</b><span>Music</span></button>
          <button type="button" onClick={toggleVoiceRecord}><b>{voiceRecording ? '■' : '��'}</b><span>Voice</span></button>
          <button type="button" onClick={() => setActivePanel('crop')}><b>⌗</b><span>Crop</span></button>
          <button type="button" onClick={() => setActivePanel('pen')}><b>✎</b><span>Pen</span></button>
        </aside>

        <aside className="vlxCameraRightTools">
          <button type="button" onClick={toggleFlash}><b>{flash ? '⚡' : '⚡︎'}</b><span>Flash</span></button>
          <button type="button" onClick={() => setGrid(!grid)}><b>▦</b><span>Grid</span></button>
          <button type="button" onClick={() => setAntiBlurMode(!antiBlurMode)}><b>{antiBlurMode ? 'AB' : 'OFF'}</b><span>AntiBlur</span></button>
          <button type="button" onClick={() => setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 5 : timerSec === 5 ? 10 : 0)}><b>{timerSec || 'Off'}</b><span>Timer</span></button>
          <button type="button" onClick={() => setActivePanel('tools')}><b>{hdEnhance ? 'HD' : 'SD'}</b><span>HD</span></button>
        </aside>

        {activePanel !== 'none' && (
          <section className="vlxCameraToolSheet">
            <div className="sheetHead">
              <b>{activePanel === 'music' ? 'Music library' : activePanel === 'stickers' ? 'Stickers' : activePanel === 'crop' ? 'Crop & frame' : activePanel === 'pen' ? 'Drawing pen' : 'Edit tools'}</b>
              <button type="button" onClick={() => setActivePanel('none')}>Done</button>
            </div>

            <button type="button" className="vlxQuickCloseTools" onClick={() => setActivePanel('none')}>
              Close editor
            </button>

            {activePanel === 'music' && (
              <div className="vlxMusicGrid">
                {MUSIC_LIBRARY.map((item) => <button key={item} type="button" className={musicTitle === item ? 'active' : ''} onClick={() => setMusicTitle(item)}>♪ {item}</button>)}
                <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="Or paste audio URL..." />
              </div>
            )}

            {activePanel === 'stickers' && (
              <div className="vlxStickerGrid">
                {STICKERS.map((item) => <button key={item} type="button" onClick={() => setEmoji(item)}>{item}</button>)}
                <label>Sticker size<input type="range" min="40" max="130" value={stickerSize} onChange={(e) => setStickerSize(Number(e.target.value))} /></label>
              </div>
            )}

            {activePanel === 'crop' && (
              <div className="vlxRatioGrid">
                {(['9:16', '1:1', '4:5', '16:9'] as Ratio[]).map((item) => <button key={item} type="button" className={ratio === item ? 'active' : ''} onClick={() => setRatio(item)}>{item}</button>)}
              </div>
            )}

            {activePanel === 'pen' && (
              <>
                <div className="vlxColorRow">{TEXT_COLORS.map((color) => <button key={color} type="button" style={{ background: color }} onClick={() => setPenColor(color)} />)}</div>
                <button type="button" className={penMode ? 'active bigTool' : 'bigTool'} onClick={() => setPenMode(!penMode)}>{penMode ? 'Stop drawing' : 'Start drawing'}</button>
                <button type="button" className="bigTool" onClick={() => setPaths([])}>Clear drawing</button>
              </>
            )}

            {activePanel === 'tools' && (
              <>
                <label>Text<input value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="Add text..." /></label>
                <label>Text size<input type="range" min="22" max="74" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} /></label>
                <div className="vlxColorRow">{TEXT_COLORS.map((color) => <button key={color} type="button" style={{ background: color }} onClick={() => setTextColor(color)} />)}</div>
                <label>Emoji<input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="✨" /></label>
                <label>Location<input value={locationTag} onChange={(e) => setLocationTag(e.target.value)} placeholder="Add location..." /></label>
                <div className="vlxHdBox">
                  <div>
                    <b>VibeLoop HD Enhance</b>
                    <span>Blur fix + noise clean + sharp detail</span>
                    <small>Capture-time blur reduction: {antiBlurMode ? 'ON' : 'OFF'}</small>
                  </div>
                  <button type="button" className={hdEnhance ? 'active' : ''} onClick={() => setHdEnhance(!hdEnhance)}>
                    {hdEnhance ? 'ON' : 'OFF'}
                  </button>
                </div>

                <label>Blur Fix / Sharpness<input type="range" min="0" max="100" value={sharpness} onChange={(e) => setSharpness(Number(e.target.value))} /></label>
                <label>Noise Cleaner<input type="range" min="0" max="100" value={denoise} onChange={(e) => setDenoise(Number(e.target.value))} /></label>
                <label>Detail Clarity<input type="range" min="0" max="100" value={clarity} onChange={(e) => setClarity(Number(e.target.value))} /></label>
                <label>Face Glow<input type="range" min="0" max="80" value={faceGlow} onChange={(e) => setFaceGlow(Number(e.target.value))} /></label>
                <label>Low Light Boost<input type="range" min="0" max="60" value={lowLightBoost} onChange={(e) => setLowLightBoost(Number(e.target.value))} /></label>

                <label>Brightness<input type="range" min="60" max="160" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} /></label>
                <label>Contrast<input type="range" min="60" max="160" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} /></label>
                <label>Saturation<input type="range" min="40" max="180" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} /></label>
              </>
            )}
          </section>
        )}

        {message && <p className="vlxCameraMessage">{message}</p>}

        {capturedUrl && capturedType === 'video' && (
          <section className="vlxVideoProcessPanel">
            <div className="processHead">
              <b>Video Studio</b>
              <span>Trim + music / voice mix + cover</span>
            </div>

            <label>
              Trim start: {trimStart}s
              <input type="range" min="0" max="60" value={trimStart} onChange={(e) => setTrimStart(Number(e.target.value))} />
            </label>

            <label>
              Trim end: {trimEnd === 0 ? 'Full' : `${trimEnd}s`}
              <input type="range" min="0" max="120" value={trimEnd} onChange={(e) => setTrimEnd(Number(e.target.value))} />
            </label>

            <label>
              Cover frame: {coverAt}s
              <input type="range" min="1" max="30" value={coverAt} onChange={(e) => setCoverAt(Number(e.target.value))} />
            </label>

            <label>
              Audio volume: {audioVolume}%
              <input type="range" min="0" max="150" value={audioVolume} onChange={(e) => setAudioVolume(Number(e.target.value))} />
            </label>

            <button type="button" className={muteOriginal ? 'active muteBtn' : 'muteBtn'} onClick={() => setMuteOriginal(!muteOriginal)}>
              {muteOriginal ? 'Original audio muted' : 'Keep original audio'}
            </button>

            <button type="button" className="processMainBtn" onClick={processCapturedVideo} disabled={processingVideo}>
              {processingVideo ? 'Processing...' : 'Process Video'}
            </button>
          </section>
        )}


        <div className="vlxCameraFilters">
          {(['original', 'dream', 'warm', 'cool', 'moody', 'vivid'] as FilterName[]).map((item) => (
            <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}><i /><span>{item}</span></button>
          ))}
        </div>

        <div className="vlxCameraCaptureArea">
          <button type="button" className="galleryBtn" onClick={() => galleryRef.current?.click()}><span>▣</span><small>Gallery</small></button>

          {capturedUrl ? (
            <div className="capturedActions">
              <button type="button" onClick={() => { setCapturedUrl(''); setCapturedBlob(null); openCamera(mode) }}>Retake</button>
              <button type="button" onClick={saveToPhone}>Save</button>
              <button type="button" className="hdEnhanceBtn" onClick={enhanceCapturedMedia} disabled={enhancing}>
                {enhancing ? 'HD...' : 'HD'}
              </button>
              {capturedType === 'video' && (
                <button type="button" className="videoProcessBtn" onClick={processCapturedVideo} disabled={processingVideo}>
                  {processingVideo ? 'Wait...' : 'Process'}
                </button>
              )}
              <button type="button" onClick={uploadAndContinue} disabled={busy}>Edit</button>
            </div>
          ) : isVideoMode() ? (
            <button type="button" className={recording ? 'shutter recording' : 'shutter'} onClick={recording ? stopRecording : startRecording}>{recording ? '■' : '●'}</button>
          ) : (
            <button type="button" className="shutter" onClick={capturePhoto} disabled={busy}>●</button>
          )}

          <button type="button" className="effectsBtn" onClick={() => setActivePanel('tools')}><span>✦</span><small>Effects</small></button>
        </div>

        <nav className="vlxCameraModes">
          {(['post', 'reel', 'story', 'live'] as Mode[]).map((item) => <button key={item} type="button" className={mode === item ? 'active' : ''} onClick={() => switchMode(item)}>{item}</button>)}
        </nav>
      </section>
    </main>
  )
}
