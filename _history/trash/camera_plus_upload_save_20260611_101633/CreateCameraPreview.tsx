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
  const inputRef = useRef<HTMLInputElement | null>(null)

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

  function chooseFile(nextType?: MediaType) {
    const t = nextType || type
    setType(t)

    setTimeout(() => {
      inputRef.current?.click()
    }, 50)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
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
    setStatus("Preview ready")
  }

  async function uploadMedia() {
    if (!file) {
      setStatus("Pehle image/video select karo")
      return
    }

    setBusy(true)
    setStatus("Publishing...")

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

        if (res.ok && (data.success !== false)) {
          setStatus("Published successfully")
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

    try {
      localStorage.setItem("vlx_last_draft", JSON.stringify({
        type,
        caption,
        name: file.name,
        time: Date.now(),
      }))
    } catch {}

    setStatus(`Backend upload route issue. Draft saved locally. ${lastError}`)
    setBusy(false)
  }

  return (
    <main className="ccPage">
      <input
        ref={inputRef}
        type="file"
        accept={type === "reel" ? "video/*" : "image/*,video/*"}
        capture="environment"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      <header className="ccHeader">
        <a href="/home">×</a>
        <div>
          <h1>Create</h1>
          <p>{type === "reel" ? "Create real reel" : type === "story" ? "Create story" : "Create post"}</p>
        </div>
        <button onClick={() => chooseFile(type)}>+</button>
      </header>

      <section className="ccTypeTabs">
        <button className={type === "post" ? "on" : ""} onClick={() => chooseFile("post")}>🖼️ Post</button>
        <button className={type === "reel" ? "on" : ""} onClick={() => chooseFile("reel")}>▶️ Reel</button>
        <button className={type === "story" ? "on" : ""} onClick={() => chooseFile("story")}>⚡ Story</button>
      </section>

      <section className="ccCreator">
        <div>{getViewer().slice(0, 1).toUpperCase()}</div>
        <span>@{getViewer()}</span>
        <small>real backend creator</small>
      </section>

      <section className="ccSteps">
        <span className={file ? "done" : "on"}>1 Upload</span>
        <span className={file ? "on" : ""}>2 Edit</span>
        <span>3 Publish</span>
      </section>

      <h2 className="ccTitle">Live Preview</h2>

      <section className={`ccPreview ${filter}`}>
        {!previewUrl && (
          <div className="ccEmpty" onClick={() => chooseFile(type)}>
            <b>+</b>
            <p>Tap to select {type === "reel" ? "video reel" : "image/video"}</p>
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

        <div className="ccActionButtons">
          <button onClick={() => chooseFile(type)}>Retake</button>
          <button onClick={() => setStatus("HD preview ready")}>HD</button>
          <button onClick={uploadMedia} disabled={busy}>{busy ? "Publishing..." : "Publish"}</button>
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
