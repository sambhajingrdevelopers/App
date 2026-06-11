"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type MediaType = "post" | "reel" | "story"
type CropType = "original" | "square" | "portrait" | "story"
type HdTool = "auto" | "face" | "blur" | "noise" | "color" | "light" | "document" | "background"

function getInitialType(): MediaType {
  if (typeof window === "undefined") return "post"
  const q = new URLSearchParams(window.location.search)
  const t = String(q.get("type") || q.get("mode") || "post").toLowerCase()
  if (t === "reel") return "reel"
  if (t === "story") return "story"
  return "post"
}

function getViewer() {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("currentUser") || ""
    if (raw.startsWith("{")) {
      const obj = JSON.parse(raw)
      return obj?.username || obj?.user?.username || obj?.profile?.username || "pradip"
    }
    return localStorage.getItem("username") || "pradip"
  } catch {
    return "pradip"
  }
}

function isVideoFile(file: File | null, type: MediaType) {
  if (file?.type?.startsWith("video/")) return true
  return type === "reel"
}

export default function CreateCameraPreview() {
  const [type, setType] = useState<MediaType>("post")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [filter, setFilter] = useState("normal")
  const [crop, setCrop] = useState<CropType>("original")
  const [hdOpen, setHdOpen] = useState(false)
  const [hdTool, setHdTool] = useState<HdTool>("auto")
  const [hdDone, setHdDone] = useState(false)
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  const attachInputRef = useRef<HTMLInputElement | null>(null)
  const captureInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setType(getInitialType())
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

  const isVideo = useMemo(() => isVideoFile(file, type), [file, type])

  function switchType(next: MediaType) {
    setType(next)
    setStatus("")
    if (next === "reel" && file && !file.type.startsWith("video/")) {
      setFile(null)
      setStatus("Reel mode me only video allowed. Please select/capture video.")
    }
  }

  function openAttach() {
    setStatus("")
    attachInputRef.current?.click()
  }

  function openCamera() {
    setStatus("")
    captureInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    e.target.value = ""

    if (!selected) return

    const image = selected.type.startsWith("image/")
    const video = selected.type.startsWith("video/")

    if (!image && !video) {
      setStatus("Only image/video supported.")
      return
    }

    if (type === "reel" && !video) {
      setStatus("Reel ke liye video select/capture karo.")
      return
    }

    setFile(selected)
    setHdDone(false)
    setStatus("Preview ready. Ab edit, HD, Save Mobile ya Upload choose karo.")
  }

  function removeMedia() {
    setFile(null)
    setPreviewUrl("")
    setHdDone(false)
    setStatus("Media removed.")
  }

  function retake() {
    setFile(null)
    setPreviewUrl("")
    setHdDone(false)
    setStatus("")
    setTimeout(openCamera, 100)
  }

  async function saveToMobile() {
    if (!file || !previewUrl) {
      setStatus("Pehle photo/video capture ya attach karo.")
      return
    }

    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")
    const name = `vibeloop_${type}_${Date.now()}.${ext}`

    try {
      const nav: any = navigator
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({
          title: "VibeLoop Media",
          text: "Save or share your media",
          files: [file],
        })
        setStatus("Mobile share/save sheet opened.")
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
      setStatus("Saved to downloads. Direct gallery save Android app me hoga.")
    } catch {
      setStatus("Save failed. Preview pe long press karke save try karo.")
    }
  }

  function runHdDemo(tool: HdTool) {
    if (!file) {
      setStatus("HD Studio ke liye pehle media select karo.")
      return
    }

    setBusy(true)
    setHdTool(tool)
    setStatus("VibeLoop HD Studio processing...")

    setTimeout(() => {
      setHdDone(true)
      setBusy(false)
      setStatus("HD preview ready. Backend HD API next phase me connect hoga.")
    }, 900)
  }

  function uploadPlaceholder() {
    if (!file) {
      setStatus("Upload ke liye pehle media select karo.")
      return
    }

    try {
      localStorage.setItem("vlx_upload_draft", JSON.stringify({
        type,
        caption,
        fileName: file.name,
        filter,
        crop,
        hdTool,
        hdDone,
        createdAt: Date.now(),
      }))
    } catch {}

    setStatus("Draft ready. Backend upload API next part me connect karenge.")
  }

  const cropClass = `crop-${crop}`
  const filterClass = `filter-${filter}`

  return (
    <main className="vlCamPage">
      <input
        ref={attachInputRef}
        type="file"
        accept={type === "reel" ? "video/*" : "image/*,video/*"}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <input
        ref={captureInputRef}
        type="file"
        accept={type === "reel" ? "video/*" : "image/*,video/*"}
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <header className="vlCamHeader">
        <a href="/home" className="vlCamClose">×</a>
        <div>
          <h1>Camera</h1>
          <p>Capture, enhance, save or upload</p>
        </div>
        <button className="vlCamTopPlus" onClick={openAttach}>＋</button>
      </header>

      <section className="vlCamModes">
        <button className={type === "post" ? "on" : ""} onClick={() => switchType("post")}>🖼️ Post</button>
        <button className={type === "reel" ? "on" : ""} onClick={() => switchType("reel")}>▶️ Reel</button>
        <button className={type === "story" ? "on" : ""} onClick={() => switchType("story")}>⚡ Story</button>
      </section>

      <section className="vlCamCreator">
        <div>{getViewer().slice(0, 1).toUpperCase()}</div>
        <strong>@{getViewer()}</strong>
        <span>real backend creator</span>
      </section>

      <section className="vlCamSteps">
        <span className={file ? "done" : "on"}>1 Capture</span>
        <span className={file ? "on" : ""}>2 Preview</span>
        <span>3 Save / Upload</span>
      </section>

      <div className="vlCamTitleRow">
        <h2>Live Preview</h2>
        {file && <button onClick={removeMedia}>Remove</button>}
      </div>

      <section className={`vlCamPreview ${cropClass} ${filterClass} ${hdDone ? "hd-on" : ""}`}>
        <button className="vlCamAttachFloating" onClick={openAttach}>
          ＋
          <small>Upload</small>
        </button>

        {!previewUrl && (
          <div className="vlCamEmpty">
            <button className="vlBigCamera" onClick={openCamera}>📷</button>
            <h3>Camera se photo/video lo</h3>
            <p>Ya plus icon se mobile gallery se media attach karo.</p>
            <button className="vlAttachButton" onClick={openAttach}>＋ Attach from Mobile</button>
          </div>
        )}

        {previewUrl && isVideo && (
          <video
            key={previewUrl}
            src={previewUrl}
            controls
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}

        {previewUrl && !isVideo && (
          <img src={previewUrl} alt="preview" />
        )}

        {hdDone && <div className="vlHdBadge">HD</div>}
      </section>

      <section className="vlCamEditor">
        <label>Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write caption..."
        />

        <label>Crop Ratio</label>
        <div className="vlCamScrollBtns">
          {[
            ["original", "Original"],
            ["square", "Square 1:1"],
            ["portrait", "Portrait 4:5"],
            ["story", "Story/Reel 9:16"],
          ].map(([key, label]) => (
            <button key={key} className={crop === key ? "on" : ""} onClick={() => setCrop(key as CropType)}>
              {label}
            </button>
          ))}
        </div>

        <label>Filter</label>
        <div className="vlCamScrollBtns">
          {["normal", "dream", "warm", "cool", "moody", "vivid", "cinema", "bw"].map((x) => (
            <button key={x} className={filter === x ? "on" : ""} onClick={() => setFilter(x)}>
              {x}
            </button>
          ))}
        </div>

        <div className="vlHdStudioHead">
          <div>
            <h3>VibeLoop HD Studio</h3>
            <p>Remini-type enhance tools, backend next phase.</p>
          </div>
          <button onClick={() => setHdOpen(!hdOpen)}>{hdOpen ? "Close" : "Open"}</button>
        </div>

        {hdOpen && (
          <div className="vlHdTools">
            <button onClick={() => runHdDemo("auto")}>✨ One Tap HD</button>
            <button onClick={() => runHdDemo("face")}>🙂 Face Enhance</button>
            <button onClick={() => runHdDemo("blur")}>🔎 Blur Fix</button>
            <button onClick={() => runHdDemo("noise")}>🌙 Noise Remove</button>
            <button onClick={() => runHdDemo("color")}>🎨 Color Fix</button>
            <button onClick={() => runHdDemo("light")}>💡 Light Fix</button>
            <button onClick={() => runHdDemo("document")}>📄 Text/Doc</button>
            <button onClick={() => runHdDemo("background")}>🖼️ BG Tools</button>
          </div>
        )}

        <div className="vlCamActions">
          <button onClick={openCamera}>Camera</button>
          <button onClick={retake}>Retake</button>
          <button onClick={saveToMobile}>Save Mobile</button>
          <button onClick={uploadPlaceholder} disabled={busy}>{busy ? "Wait..." : "Upload"}</button>
        </div>

        {status && <p className="vlCamStatus">{status}</p>}
      </section>

      <nav className="vlCamBottom">
        <a href="/home">⌂<span>Home</span></a>
        <a href="/search">⌕<span>Search</span></a>
        <a className="cam" href="/camera?type=post">📷<span>Camera</span></a>
        <a href="/reels">▶<span>Reels</span></a>
        <a href="/profile">◉<span>Profile</span></a>
      </nav>
    </main>
  )
}
