"use client"

import { useEffect, useState } from "react"

function mediaUrl(item: any) {
  const raw =
    item?.mediaUrl ||
    item?.media_url ||
    item?.imageUrl ||
    item?.image_url ||
    item?.videoUrl ||
    item?.video_url ||
    item?.url ||
    item?.src ||
    ""

  const url = String(raw || "").trim()
  if (!url) return ""
  if (url.startsWith("http://13.206.145.54:8003/media/")) return url.replace("http://13.206.145.54:8003", "")
  if (url.startsWith("https://13.206.145.54:8003/media/")) return url.replace("https://13.206.145.54:8003", "")
  if (url.startsWith("media/")) return `/${url}`
  return url
}

function isVideo(item: any) {
  const url = mediaUrl(item)
  return item?.type === "reel" || item?.media_type === "video" || item?.mediaType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

export default function HomePage() {
  const [data, setData] = useState<any>({ users: [], posts: [], reels: [], feed: [] })
  const [tab, setTab] = useState<"all" | "posts" | "reels">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    try {
      setLoading(true)
      setError("")
      const res = await fetch(`/api/v1/social/home?t=${Date.now()}`, { cache: "no-store" })
      const json = await res.json()

      setData({
        users: json.users || json.creators || [],
        posts: json.posts || [],
        reels: json.reels || [],
        feed: json.feed || json.items || [],
      })
    } catch (e: any) {
      setError(e?.message || "Feed loading failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const list =
    tab === "posts" ? data.posts :
    tab === "reels" ? data.reels :
    data.feed

  return (
    <main className="vlxHome">
      <header className="vlxHeader">
        <div>
          <h1>VibeLoop</h1>
          <p>Real connected social feed</p>
        </div>
        <button onClick={load}>↻</button>
      </header>

      <div className="vlxSearch">⚡ Search creators, posts, reels...</div>

      <section className="vlxCreators">
        <div className="vlxSectionTitle">
          <h2>Creators</h2>
          <span>{data.users.length}</span>
        </div>

        <div className="vlxCreatorRow">
          <a className="vlxCreatorAdd" href="/camera?type=post">+</a>

          {data.users.map((u: any) => (
            <a key={u.username || u.id} className="vlxCreator" href={`/profile?u=${u.username}`}>
              <div>{String(u.username || "U").slice(0, 1).toUpperCase()}</div>
              <b>{u.username}</b>
              <small>{u.posts_count || 0} post · {u.reels_count || 0} reel</small>
            </a>
          ))}
        </div>
      </section>

      <div className="vlxTabs">
        <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>All</button>
        <button className={tab === "posts" ? "on" : ""} onClick={() => setTab("posts")}>Posts</button>
        <button className={tab === "reels" ? "on" : ""} onClick={() => setTab("reels")}>Reels</button>
      </div>

      {loading && <div className="vlxEmpty">Loading real posts and reels...</div>}
      {error && <div className="vlxEmpty">{error}</div>}

      {!loading && !error && list.length === 0 && (
        <div className="vlxEmpty">No playable posts/reels found. Backend media path check karo.</div>
      )}

      <section className="vlxFeed">
        {list.map((item: any) => {
          const url = mediaUrl(item)
          return (
            <article key={`${item.type}_${item.id}_${url}`} className="vlxCard">
              <div className="vlxCardTop">
                <div className="vlxAvatar">{String(item.username || "U").slice(0, 1).toUpperCase()}</div>
                <div>
                  <h3>{item.username} <span>✓</span></h3>
                  <p>{item.type || item.media_type} · VibeLoop</p>
                </div>
                <a href={isVideo(item) ? `/reels` : `/post/${item.id}`}>•••</a>
              </div>

              <div className="vlxMedia">
                {!url && <div className="vlxUnavailable">Media unavailable</div>}
                {url && isVideo(item) && (
                  <video src={url} controls playsInline muted preload="metadata" />
                )}
                {url && !isVideo(item) && (
                  <img src={url} alt={item.caption || "post"} />
                )}
              </div>

              <div className="vlxCaption">
                <b>@{item.username}</b> {item.caption || item.title}
              </div>

              <div className="vlxActions">
                <button>♡ {item.likes || 0}</button>
                <button>💬 {item.comments || 0}</button>
                <button>↗ {item.shares || 0}</button>
                <button>🔖 Save</button>
              </div>
            </article>
          )
        })}
      </section>

      <nav className="vlxBottom">
        <a className="on" href="/">⌂<span>Home</span></a>
        <a href="/search">⌕<span>Search</span></a>
        <a className="cam" href="/camera?type=post">📷<span>Camera</span></a>
        <a href="/reels">▶<span>Reels</span></a>
        <a href="/profile">◉<span>Profile</span></a>
      </nav>
    </main>
  )
}
