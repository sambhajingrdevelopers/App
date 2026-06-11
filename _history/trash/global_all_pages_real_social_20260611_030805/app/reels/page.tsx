"use client"

import { useEffect, useState } from "react"

function mediaUrl(item: any) {
  const raw = item?.videoUrl || item?.video_url || item?.mediaUrl || item?.media_url || item?.url || item?.src || ""
  const url = String(raw || "").trim()
  if (!url) return ""
  if (url.startsWith("http://13.206.145.54:8003/media/")) return url.replace("http://13.206.145.54:8003", "")
  if (url.startsWith("https://13.206.145.54:8003/media/")) return url.replace("https://13.206.145.54:8003", "")
  if (url.startsWith("media/")) return `/${url}`
  return url
}

export default function ReelsPage() {
  const [reels, setReels] = useState<any[]>([])
  const [active, setActive] = useState(0)
  const [msg, setMsg] = useState("Loading reels...")

  async function load() {
    try {
      setMsg("Loading reels...")
      const res = await fetch(`/api/v1/reels?t=${Date.now()}`, { cache: "no-store" })
      const json = await res.json()
      const list = json.reels || json.items || json.data || []
      const clean = list.filter((x: any) => mediaUrl(x))
      setReels(clean)
      setActive(0)
      setMsg(clean.length ? "" : "No playable reels found")
    } catch {
      setMsg("Reels loading failed")
    }
  }

  useEffect(() => {
    load()
  }, [])

  const item = reels[active]
  const url = item ? mediaUrl(item) : ""

  return (
    <main className="vlxReels">
      {!item && <div className="vlxCenter">{msg}</div>}

      {item && (
        <>
          <video
            key={item.id}
            className="vlxReelVideo"
            src={url}
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setMsg("Video file not loading. Backend /media path check karo.")}
          />

          {msg && <div className="vlxToast">{msg}</div>}

          <button className="vlxLeftTap" onClick={() => setActive((active - 1 + reels.length) % reels.length)} />
          <button className="vlxRightTap" onClick={() => setActive((active + 1) % reels.length)} />

          <div className="vlxReelInfo">
            <div className="vlxAvatar">{String(item.username || "U").slice(0, 1).toUpperCase()}</div>
            <div>
              <h2>@{item.username} <span>✓</span></h2>
              <p>{item.caption || item.title}</p>
              <small>{active + 1} / {reels.length} · {item.source || "real"}</small>
            </div>
          </div>

          <div className="vlxReelActions">
            <button>♡<small>{item.likes || 0}</small></button>
            <button>💬<small>{item.comments || 0}</small></button>
            <button onClick={() => setActive((active + 1) % reels.length)}>▶<small>Next</small></button>
            <button>��<small>Save</small></button>
          </div>
        </>
      )}

      <nav className="vlxBottom">
        <a href="/">⌂<span>Home</span></a>
        <a href="/search">⌕<span>Search</span></a>
        <a className="cam" href="/camera?type=post">��<span>Camera</span></a>
        <a className="on" href="/reels">▶<span>Reels</span></a>
        <a href="/profile">◉<span>Profile</span></a>
      </nav>
    </main>
  )
}
