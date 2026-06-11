"use client"

import { useEffect, useMemo, useState } from "react"

type Mode = "home" | "profile" | "search" | "reels" | "post" | "reel" | "user"
type Tab = "all" | "posts" | "reels"

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
    item?.kind === "reel" ||
    item?.media_type === "video" ||
    item?.mediaType === "video" ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
  )
}

function sameUser(item: any, username: string) {
  if (!username) return true
  const a = String(item?.username || item?.author || item?.user || "").replace("@", "").toLowerCase()
  const b = String(username || "").replace("@", "").toLowerCase()
  return a === b
}

function sameId(item: any, id: string) {
  if (!id) return false
  const keys = [item?.id, item?.post_id, item?.reel_id, item?.postId, item?.reelId]
  return keys.map((x) => String(x || "")).includes(String(id))
}

function itemId(item: any) {
  return String(item?.id || item?.post_id || item?.reel_id || mediaUrl(item) || Math.random())
}

export default function RealSocialFeed({ mode }: { mode: Mode }) {
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [reels, setReels] = useState<any[]>([])
  const [feed, setFeed] = useState<any[]>([])
  const [active, setActive] = useState(0)
  const [q, setQ] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const [status, setStatus] = useState("Loading real content...")
  const [likes, setLikes] = useState<Record<string, boolean>>({})
  const [saves, setSaves] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, number>>({})
  const [commentFor, setCommentFor] = useState<any>(null)
  const [commentText, setCommentText] = useState("")

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
      const nextPosts = (json.posts || []).filter((x: any) => mediaUrl(x))
      const nextReels = (json.reels || []).filter((x: any) => mediaUrl(x))
      const nextFeed = (json.feed || json.items || [...nextPosts, ...nextReels]).filter((x: any) => mediaUrl(x))

      setUsers(nextUsers)
      setPosts(nextPosts)
      setReels(nextReels)
      setFeed(nextFeed)
      setStatus("")
    } catch (e: any) {
      setStatus(e?.message || "Content loading failed")
    }
  }

  useEffect(() => {
    load()
    try {
      setLikes(JSON.parse(localStorage.getItem("vlx_likes") || "{}"))
      setSaves(JSON.parse(localStorage.getItem("vlx_saves") || "{}"))
      setComments(JSON.parse(localStorage.getItem("vlx_comments") || "{}"))
    } catch {}
  }, [])

  function saveLocal(nextLikes = likes, nextSaves = saves, nextComments = comments) {
    try {
      localStorage.setItem("vlx_likes", JSON.stringify(nextLikes))
      localStorage.setItem("vlx_saves", JSON.stringify(nextSaves))
      localStorage.setItem("vlx_comments", JSON.stringify(nextComments))
    } catch {}
  }

  function toggleLike(item: any) {
    const id = itemId(item)
    const next = { ...likes, [id]: !likes[id] }
    setLikes(next)
    saveLocal(next, saves, comments)
  }

  function toggleSave(item: any) {
    const id = itemId(item)
    const next = { ...saves, [id]: !saves[id] }
    setSaves(next)
    saveLocal(likes, next, comments)
  }

  function openComment(item: any) {
    setCommentFor(item)
    setCommentText("")
  }

  function submitComment() {
    if (!commentFor) return
    const id = itemId(commentFor)
    const next = { ...comments, [id]: (comments[id] || 0) + 1 }
    setComments(next)
    saveLocal(likes, saves, next)
    setCommentFor(null)
    setCommentText("")
  }

  async function shareItem(item: any) {
    const url = typeof window !== "undefined" ? window.location.origin + (isVideo(item) ? `/reel/${itemId(item)}` : `/post/${itemId(item)}`) : ""
    const title = item?.caption || item?.title || "VibeLoop"

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        alert("Link copied")
      }
    } catch {}
  }

  const queryUsername = useMemo(() => {
    return getQuery("u") || getQuery("username") || (mode === "user" ? getPathId() : "")
  }, [mode])

  const selectedUsername = useMemo(() => {
    if (queryUsername) return queryUsername.replace("@", "")
    const firstWithContent = users.find((u) => Number(u.posts_count || 0) + Number(u.reels_count || 0) > 0)
    return String(firstWithContent?.username || users[0]?.username || "").replace("@", "")
  }, [queryUsername, users])

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
      const allUserItems = [...posts, ...reels].filter((x) => sameUser(x, selectedUsername))
      if (tab === "posts") list = allUserItems.filter((x) => !isVideo(x))
      else if (tab === "reels") list = allUserItems.filter((x) => isVideo(x))
      else list = allUserItems
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
  }, [mode, posts, reels, feed, selectedUsername, id, q, tab])

  const profileUser = useMemo(() => {
    const user = users.find((u) => String(u.username || "").replace("@", "").toLowerCase() === selectedUsername.toLowerCase())
    const userPosts = posts.filter((x) => sameUser(x, selectedUsername))
    const userReels = reels.filter((x) => sameUser(x, selectedUsername))

    return {
      username: selectedUsername || "profile",
      name: user?.name || user?.display_name || selectedUsername || "Profile",
      bio: user?.bio || "Real connected VibeLoop creator",
      avatar: user?.avatar || user?.avatar_url || "",
      posts_count: userPosts.length,
      reels_count: userReels.length,
      total: userPosts.length + userReels.length,
    }
  }, [users, posts, reels, selectedUsername])

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
              <button onClick={() => toggleLike(item)}>{likes[itemId(item)] ? "♥" : "♡"}<small>{Number(item.likes || 0) + (likes[itemId(item)] ? 1 : 0)}</small></button>
              <button onClick={() => openComment(item)}>💬<small>{Number(item.comments || 0) + (comments[itemId(item)] || 0)}</small></button>
              <button onClick={() => shareItem(item)}>↗<small>Share</small></button>
              <button onClick={() => toggleSave(item)}>{saves[itemId(item)] ? "✅" : "🔖"}<small>Save</small></button>
            </div>

            <CommentBox
              item={commentFor}
              text={commentText}
              setText={setCommentText}
              close={() => setCommentFor(null)}
              submit={submitComment}
            />
          </>
        )}

        <BottomNav active="reels" />
      </main>
    )
  }

  const isProfile = mode === "profile" || mode === "user"

  return (
    <main className={isProfile ? "rsPage rsProfilePage" : "rsPage"}>
      <header className="rsHeader">
        <div>
          <h1>{isProfile ? "Profile" : "VibeLoop"}</h1>
          <p>{isProfile ? "Creator profile with posts and reels" : "Real connected posts, reels and creators"}</p>
        </div>
        <button onClick={load}>↻</button>
      </header>

      {isProfile && (
        <section className="rsProfileHero">
          <div className="rsProfileTop">
            <div className="rsProfileAvatar">
              {String(profileUser.username || "U").slice(0, 1).toUpperCase()}
            </div>

            <div className="rsProfileStats">
              <div><b>{profileUser.posts_count}</b><span>Posts</span></div>
              <div><b>{profileUser.reels_count}</b><span>Reels</span></div>
              <div><b>{profileUser.total}</b><span>Media</span></div>
            </div>
          </div>

          <h2>@{profileUser.username} <span>✓</span></h2>
          <p>{profileUser.bio}</p>

          <div className="rsProfileButtons">
            <button onClick={() => { window.location.href = "/profile/edit" }}>Edit Profile</button>
            <button onClick={() => { window.location.href = `/messages?to=${profileUser.username}` }}>Message</button>
          </div>

          <div className="rsProfileTabs">
            <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>All</button>
            <button className={tab === "posts" ? "on" : ""} onClick={() => setTab("posts")}>Posts</button>
            <button className={tab === "reels" ? "on" : ""} onClick={() => setTab("reels")}>Reels</button>
          </div>
        </section>
      )}

      {!isProfile && (
        <input
          className="rsSearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search creators, posts, reels..."
        />
      )}

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

      <section className={isProfile ? "rsProfileGrid" : "rsFeed"}>
        {visibleItems.map((item: any) => {
          const url = mediaUrl(item)
          const video = isVideo(item)

          if (isProfile) {
            return (
              <a key={`${item.type}_${item.id}_${url}`} className="rsGridItem" href={video ? `/reel/${itemId(item)}` : `/post/${itemId(item)}`}>
                {video ? <video src={url} muted playsInline preload="metadata" /> : <img src={url} alt={item.caption || "post"} />}
                {video && <span>▶</span>}
              </a>
            )
          }

          return (
            <article key={`${item.type}_${item.id}_${url}`} className="rsCard">
              <div className="rsCardTop">
                <div className="rsAvatar">{String(item.username || "U").slice(0, 1).toUpperCase()}</div>
                <div>
                  <h3>@{item.username} <span>✓</span></h3>
                  <p>{video ? "reel" : "post"} · {item.source || "real"}</p>
                </div>
                <a href={video ? `/reel/${itemId(item)}` : `/post/${itemId(item)}`}>•••</a>
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
                <button onClick={() => toggleLike(item)}>{likes[itemId(item)] ? "♥" : "♡"} {Number(item.likes || 0) + (likes[itemId(item)] ? 1 : 0)}</button>
                <button onClick={() => openComment(item)}>💬 {Number(item.comments || 0) + (comments[itemId(item)] || 0)}</button>
                <button onClick={() => shareItem(item)}>↗ Share</button>
                <button onClick={() => toggleSave(item)}>{saves[itemId(item)] ? "✅ Saved" : "🔖 Save"}</button>
              </div>
            </article>
          )
        })}
      </section>

      <CommentBox
        item={commentFor}
        text={commentText}
        setText={setCommentText}
        close={() => setCommentFor(null)}
        submit={submitComment}
      />

      <BottomNav active={mode === "search" ? "search" : isProfile ? "profile" : "home"} />
    </main>
  )
}

function CommentBox({
  item,
  text,
  setText,
  close,
  submit,
}: {
  item: any
  text: string
  setText: (v: string) => void
  close: () => void
  submit: () => void
}) {
  if (!item) return null

  return (
    <div className="rsCommentOverlay">
      <div className="rsCommentBox">
        <button className="rsClose" onClick={close}>×</button>
        <h3>Comment</h3>
        <p>@{item.username}</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write comment..." />
        <button className="rsSubmit" onClick={submit} disabled={!text.trim()}>Post Comment</button>
      </div>
    </div>
  )
}

function BottomNav({ active }: { active: string }) {
  return (
    <nav className="rsBottom">
      <a className={active === "home" ? "on" : ""} href="/home">⌂<span>Home</span></a>
      <a className={active === "search" ? "on" : ""} href="/search">⌕<span>Search</span></a>
      <a className="cam" href="/camera?type=post">📷<span>Camera</span></a>
      <a className={active === "reels" ? "on" : ""} href="/reels">▶<span>Reels</span></a>
      <a className={active === "profile" ? "on" : ""} href="/profile">◉<span>Profile</span></a>
    </nav>
  )
}
