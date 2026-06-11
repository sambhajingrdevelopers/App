"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type MediaType = "post" | "reel" | "story"

function getType(): MediaType {
  if (typeof window === "undefined") return "post"
  const q = new URLSearchParams(window.location.search)
  const type = (q.get("type") || q.get("mode") || "post").toLowerCase()
  if (type === "reel") return "reel"
  if (type === "story") return "story"
  return "post"
}

function getViewer() {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("currentUser") || ""
    if (raw.startsWith("{")) {
      const obj = JSON.parse(raw)
      return obj.username || obj.user?.username || "pradip"
    }
    return localStorage.getItem("username") || "pradip"
  } catch {
    return "pradip"
  }
}

export default function CreateCameraPreview() {
  const [type, setType] = useState<MediaType>("post")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [filter, setFilter] = useState("normal")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("")

  const attachRef = useRef<HTMLInputElement | null>(null)
  const captureRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setType(getType())
  }, [])

  useEffect(() => {
    if (!file) {
      setPreviewUrl("")
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  const isVideo = useMemo(() => {
    if (file?.type?.startsWith("video/")) return true
    if (type === "reel") return true
    return false
  }, [file, type])

  function openAttach(nextType?: MediaType) {
    const t = nextType || type
    setType(t)
    setStatus("")
    setTimeout(() => attachRef.current?.click(), 50)
  }

  function openCamera(nextType?: MediaType) {
    const t = nextType || type
    setType(t)
    setStatus("")
    setTimeout(() => captureRef.current?.click(), 50)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ""

    if (!f) return

    const video = f.type.startsWith("video/")
    const image = f.type.startsWith("image/")

    if (!video && !image) {
      setStatus("Only image/video supported")
      return
    }

    if (type === "reel" && !video) {
      setStatus("Reel ke liye video select karo")
      return
    }

    setFile(f)
    setStatus("Media ready. Ab Upload ya Save to Mobile choose karo.")
  }

  async function saveToMobile() {
    if (!file || !previewUrl) {
      setStatus("Pehle photo/video capture ya attach karo")
      return
    }

    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")
    const name = `vibeloop_${type}_${Date.now()}.${ext}`

    try {
      // Android Chrome me share sheet open ho sakta hai.
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: "VibeLoop Media",
          text: "Save or share your media",
          files: [file],
        })
        setStatus("Mobile share/save opened")
        return
      }
    } catch {}

    try {
      const a = document.createElement("a")
      a.href = previewUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setStatus("Saved to downloads. Gallery direct save ke liye Android app required.")
    } catch {
      setStatus("Save failed. Long press preview and save manually.")
    }
  }

  async function uploadMedia() {
    if (!file) {
      setStatus("Pehle photo/video capture ya attach karo")
      return
    }

    setBusy(true)
    setStatus("Uploading...")

    const viewer = getViewer()
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", type)
    fd.append("media_type", isVideo ? "video" : "image")
    fd.append("caption", caption || `${type} by ${viewer}`)
    fd.append("username", viewer)
    fd.append("viewer", viewer)

    const endpoints = [
      "/api/v1/media/upload",
      "/api/v1/content/upload",
      type === "reel" ? "/api/v1/reels" : "/api/v1/posts",
      "/api/v1/social/publish",
    ]

    let lastError = ""

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          body: fd,
        })

        const text = await res.text()
        let data: any = {}

        try {
          data = JSON.parse(text)
        } catch {
          lastError = `${url} returned non JSON`
          continue
        }

        if (res.ok && data.success !== false) {
          setStatus("Uploaded successfully")
          setTimeout(() => {
            window.location.href = type === "reel" ? "/reels" : "/home"
          }, 700)
          return
        }

        lastError = data.message || data.detail || `${url} failed`
      } catch (e: any) {
        lastError = e?.message || "Upload failed"
      }
    }

    setStatus(`Backend upload route issue: ${lastError}`)
    setBusy(false)
  }

  function retake() {
    setFile(null)
    setPreviewUrl("")
    setStatus("")
    openCamera(type)
  }

  return (
    <main className="ccPage">
      <input
        ref={attachRef}
        type="file"
        accept={type === "reel" ? "video/*" : "image/*,video/*"}
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      <input
        ref={captureRef}
        type="file"
        accept={type === "reel" ? "video/*" : "image/*,video/*"}
        capture="environment"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      <header className="ccHeader">
        <a href="/home">×</a>
        <div>
          <h1>Camera</h1>
          <p>{type === "reel" ? "Capture or upload reel" : type === "story" ? "Capture story" : "Capture or upload post"}</p>
        </div>
        <button className="ccPlusTop" onClick={() => openAttach(type)}>＋</button>
      </header>

      <section className="ccTypeTabs">
        <button className={type === "post" ? "on" : ""} onClick={() => setType("post")}>🖼️ Post</button>
        <button className={type === "reel" ? "on" : ""} onClick={() => setType("reel")}>▶️ Reel</button>
        <button className={type === "story" ? "on" : ""} onClick={() => setType("story")}>⚡ Story</button>
      </section>

      <section className="ccCreator">
        <div>{getViewer().slice(0, 1).toUpperCase()}</div>
        <span>@{getViewer()}</span>
        <small>real backend creator</small>
      </section>

      <section className="ccSteps">
        <span className={file ? "done" : "on"}>1 Capture</span>
        <span className={file ? "on" : ""}>2 Preview</span>
        <span>3 Upload / Save</span>
      </section>

      <h2 className="ccTitle">Live Preview</h2>

      <section className={`ccPreview ${filter}`}>
        <button className="ccAttachPlus" onClick={() => openAttach(type)} title="Attach from mobile">
          ＋
          <small>Upload</small>
        </button>

        {!previewUrl && (
          <div className="ccEmpty">
            <b onClick={() => openCamera(type)}>📷</b>
            <p>Camera se photo/video lo</p>
            <button onClick={() => openAttach(type)}>＋ Attach from Mobile</button>
          </div>
        )}

        {previewUrl && isVideo && (
          <video
            key={previewUrl}
            src={previewUrl}
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        {previewUrl && !isVideo && (
          <img src={previewUrl} alt="preview" />
        )}
      </section>

      <section className="ccEditor">
        <label>Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write caption..."
        />

        <label>Filter</label>
        <div className="ccFilters">
          {["normal", "dream", "warm", "cool", "moody", "vivid"].map((x) => (
            <button key={x} className={filter === x ? "on" : ""} onClick={() => setFilter(x)}>{x}</button>
          ))}
        </div>

        <div className="ccActionButtons four">
          <button onClick={() => openCamera(type)}>Camera</button>
          <button onClick={retake}>Retake</button>
          <button onClick={saveToMobile}>Save Mobile</button>
          <button onClick={uploadMedia} disabled={busy}>{busy ? "Uploading..." : "Upload"}</button>
        </div>

        {status && <p className="ccStatus">{status}</p>}
      </section>

      <nav className="ccBottom">
        <a href="/home">⌂<span>Home</span></a>
        <a href="/search">⌕<span>Search</span></a>
        <a className="cam" href="/camera?type=post">📷<span>Camera</span></a>
        <a href="/reels">▶<span>Reels</span></a>
        <a href="/profile">◉<span>Profile</span></a>
      </nav>
    </main>
  )
}
