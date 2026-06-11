"use client"

import { useEffect, useMemo, useState } from "react"

type Mode = "home" | "profile" | "search" | "reels" | "post" | "reel" | "user"

function getPathId() {
  if (typeof window === "undefined") return ""
  const parts = window.location.pathname.split("/").filter(Boolean)
  return decodeURIComponent(parts[parts.length - 1] || "")
}

function getQuery(name: string) {
  if (typeof window === "undefined") return ""
  return new URLSearchParams(window.location.search).get(name) || ""
}

function mediaUrl(item: any) {
  const raw =
    item?.mediaUrl ||
    item?.media_url ||
    item?.imageUrl ||
    item?.image_url ||
    item?.videoUrl ||
    item?.video_url ||
    item?.thumbnailUrl ||
    item?.thumbnail_url ||
    item?.url ||
    item?.src ||
    ""

  const url = String(raw || "").trim()
  if (!url) return ""

  if (url.startsWith("http://13.206.145.54:8003/media/")) {
    return url.replace("http://13.206.145.54:8003", "")
  }

  if (url.startsWith("https://13.206.145.54:8003/media/")) {
    return url.replace("https://13.206.145.54:8003", "")
  }

  if (url.startsWith("media/")) return `/${url}`

  return url
}

function isVideo(item: any) {
  const url = mediaUrl(item)
  return (
    item?.type === "reel" ||
    item?.media_type === "video" ||
    item?.mediaType === "video" ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
  )
}

function sameUser(item: any, username: string) {
  if (!username) return true
  const a = String(item?.username || item?.author || "").replace("@", "").toLowerCase()
  const b = String(username || "").replace("@", "").toLowerCase()
  return a === b
}

function sameId(item: any, id: string) {
  if (!id) return false
  const keys = [item?.id, item?.post_id, item?.reel_id, item?.postId, item?.reelId]
  return keys.map((x) => String(x || "")).includes(String(id))
}

export default function RealSocialFeed({ mode }: { mode: Mode }) {
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [reels, setReels] = useState<any[]>([])
  const [feed, setFeed] = useState<any[]>([])
  const [active, setActive] = useState(0)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("Loading real content...")

  async function load() {
    try {
      setStatus("Loading real content...")

      const res = await fetch(`/api/v1/social/home?t=${Date.now()}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
      })

      const text = await res.text()
      let json: any = {}

      try {
        json = JSON.parse(text)
      } catch {
        throw new Error("Backend returned HTML instead of JSON")
      }

      const nextUsers = json.users || json.creators || []
      const nextPosts = json.posts || []
      const nextReels = json.reels || []
      const nextFeed = json.feed || json.items || [...nextPosts, ...nextReels]

      setUsers(nextUsers)
      setPosts(nextPosts.filter((x: any) => mediaUrl(x)))
      setReels(nextReels.filter((x: any) => mediaUrl(x)))
      setFeed(nextFeed.filter((x: any) => mediaUrl(x)))

      setStatus("")
    } catch (e: any) {
      setStatus(e?.message || "Content loading failed")
    }
  }

  useEffect(() => {
    load()
  }, [])

  const username = useMemo(() => {
    return getQuery("u") || getQuery("username") || (mode === "user" ? getPathId() : "")
  }, [mode])

  const id = useMemo(() => {
    return mode === "post" || mode === "reel" ? getPathId() : ""
  }, [mode])

  const visibleUsers = useMemo(() => {
    const search = q.trim().toLowerCase()
    if (!search) return users
    return users.filter((u) =>
      String(u.username || u.name || "").toLowerCase().includes(search)
    )
  }, [users, q])

  const visibleItems = useMemo(() => {
    let list: any[] = []

    if (mode === "reels") list = reels
    else if (mode === "post") list = posts.filter((x) => sameId(x, id))
    else if (mode === "reel") list = reels.filter((x) => sameId(x, id))
    else if (mode === "profile" || mode === "user") {
      list = [...posts, ...reels].filter((x) => sameUser(x, username))
    } else {
      list = feed
    }

    const search = q.trim().toLowerCase()
    if (mode === "search" && search) {
      list = feed.filter((x) => {
        const s = `${x.username || ""} ${x.caption || ""} ${x.title || ""}`.toLowerCase()
        return s.includes(search)
      })
    }

    return list
  }, [mode, posts, reels, feed, username, id, q])

  if (mode === "reels") {
    const item = visibleItems[active]
    const url = item ? mediaUrl(item) : ""

    return (
      <main className="rsReels">
        {!item && <div className="rsCenter">{status || "No playable reels found"}</div>}

        {item && (
          <>
            <video
              key={`${item.id}_${url}`}
              className="rsReelVideo"
              src={url}
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setStatus("Video file not loading. Backend /media check karo.")}
            />

            {status && <div className="rsToast">{status}</div>}

            <button
              className="rsLeftTap"
              onClick={() => setActive((active - 1 + visibleItems.length) % visibleItems.length)}
            />
            <button
              className="rsRightTap"
              onClick={() => setActive((active + 1) % visibleItems.length)}
            />

            <div className="rsReelInfo">
              <div className="rsAvatar">{String(item.username || "U").slice(0, 1).toUpperCase()}</div>
              <div>
                <h2>@{item.username} <span>✓</span></h2>
                <p>{item.caption || item.title}</p>
                <small>{active + 1} / {visibleItems.length} · {item.source || "real"}</small>
              </div>
            </div>

            <div className="rsReelActions">
              <button>♡<small>{item.likes || 0}</small></button>
              <button>💬<small>{item.comments || 0}</small></button>
              <button onClick={() => setActive((active + 1) % visibleItems.length)}>▶<small>Next</small></button>
              <button>🔖<small>Save</small></button>
            </div>
          </>
        )}

        <BottomNav active="reels" />
      </main>
    )
  }

  return (
    <main className="rsPage">
      <header className="rsHeader">
        <div>
          <h1>{mode === "profile" || mode === "user" ? username || "Profile" : "VibeLoop"}</h1>
          <p>Real connected posts, reels and creators</p>
        </div>
        <button onClick={load}>↻</button>
      </header>

      <input
        className="rsSearch"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search creators, posts, reels..."
      />

      {(mode === "home" || mode === "search") && (
        <section className="rsCreators">
          <div className="rsTitle">
            <h2>Creators</h2>
            <span>{visibleUsers.length}</span>
          </div>

          <div className="rsCreatorRow">
            <a className="rsCreatorAdd" href="/camera?type=post">+</a>

            {visibleUsers.map((u: any) => (
              <a key={u.username || u.id} className="rsCreator" href={`/profile?u=${u.username}`}>
                <div>{String(u.username || "U").slice(0, 1).toUpperCase()}</div>
                <b>{u.username}</b>
                <small>{u.posts_count || 0} post · {u.reels_count || 0} reel</small>
              </a>
            ))}
          </div>
        </section>
      )}

      {status && <div className="rsEmpty">{status}</div>}

      {!status && visibleItems.length === 0 && (
        <div className="rsEmpty">No playable posts/reels found</div>
      )}

      <section className="rsFeed">
        {visibleItems.map((item: any) => {
          const url = mediaUrl(item)
          const video = isVideo(item)

          return (
            <article key={`${item.type}_${item.id}_${url}`} className="rsCard">
              <div className="rsCardTop">
                <div className="rsAvatar">{String(item.username || "U").slice(0, 1).toUpperCase()}</div>
                <div>
                  <h3>@{item.username} <span>✓</span></h3>
                  <p>{video ? "reel" : "post"} · {item.source || "real"}</p>
                </div>
                <a href={video ? `/reel/${item.id}` : `/post/${item.id}`}>•••</a>
              </div>

              <div className="rsMedia">
                {video ? (
                  <video src={url} controls muted playsInline preload="metadata" />
                ) : (
                  <img src={url} alt={item.caption || "post"} />
                )}
              </div>

              <div className="rsCaption">
                <b>@{item.username}</b> {item.caption || item.title}
              </div>

              <div className="rsActions">
                <button>♡ {item.likes || 0}</button>
                <button>💬 {item.comments || 0}</button>
                <button>↗ {item.shares || 0}</button>
                <button>🔖 Save</button>
              </div>
            </article>
          )
        })}
      </section>

      <BottomNav active={mode === "search" ? "search" : mode === "profile" || mode === "user" ? "profile" : "home"} />
    </main>
  )
}

function BottomNav({ active }: { active: string }) {
  return (
    <nav className="rsBottom">
      <a className={active === "home" ? "on" : ""} href="/">⌂<span>Home</span></a>
      <a className={active === "search" ? "on" : ""} href="/search">⌕<span>Search</span></a>
      <a className="cam" href="/camera?type=post">📷<span>Camera</span></a>
      <a className={active === "reels" ? "on" : ""} href="/reels">▶<span>Reels</span></a>
      <a className={active === "profile" ? "on" : ""} href="/profile">◉<span>Profile</span></a>
    </nav>
  )
}
