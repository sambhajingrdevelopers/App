import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

function sameId(a: any, b: any) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase()
}

function normalize(item: any, fallbackKind = "post") {
  const username = String(item.username || item.user || item.owner || "@creator").trim()
  const finalUsername = username.startsWith("@") ? username : `@${username}`

  return {
    id: String(item.id || item.contentId || item.content_id || ""),
    kind: item.kind || item.type || fallbackKind,
    type: item.kind || item.type || fallbackKind,
    title: item.title || item.caption || fallbackKind,
    caption: item.caption || "",
    username: finalUsername,
    user: finalUsername,
    name: item.name || finalUsername.replace("@", ""),
    avatarUrl: proxifyUrl( item.avatarUrl || item.avatar_url || ""),
    mediaUrl: item.mediaUrl || item.media_url || item.imageUrl || item.image_url || "",
    videoUrl: item.videoUrl || item.video_url || "",
    mediaType: item.mediaType || item.media_type || (item.videoUrl || item.video_url ? "video" : "image"),
    location: item.location || "India",
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    shares: Number(item.shares || 0),
    views: Number(item.views || 0),
    createdAt: item.createdAt || item.created_at || "",
  }
}

async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store" })
  const text = await res.text()
  try {
    return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : {} }
  } catch {
    return { ok: false, status: res.status, data: { success: false, message: text } }
  }
}

function proxifyUrl(url: any) {
  const clean = String(url || "").trim()
  if (!clean) return ""
  if (clean.startsWith("/api/media/proxy")) return clean
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/media/")) {
    return `/api/media/proxy?url=${encodeURIComponent(clean)}`
  }
  return clean
}

function proxifyMedia(value: any): any {
  if (Array.isArray(value)) return value.map(proxifyMedia)
  if (!value || typeof value !== "object") return value

  const next: any = { ...value }

  for (const key of ["mediaUrl", "media_url", "videoUrl", "video_url", "coverUrl", "coverImage", "imageUrl", "image_url", "avatarUrl", "avatar_url"]) {
    if (next[key]) next[key] = proxifyUrl(next[key])
  }

  for (const key of Object.keys(next)) {
    if (next[key] && typeof next[key] === "object") next[key] = proxifyMedia(next[key])
  }

  return next
}

export async function GET(request: NextRequest) {
  const id =
    request.nextUrl.searchParams.get("id") ||
    request.nextUrl.searchParams.get("content_id") ||
    request.nextUrl.searchParams.get("contentId") ||
    ""

  if (!id) {
    return NextResponse.json({
      success: false,
      message: "Content id required.",
      item: null,
    }, { status: 400 })
  }

  const directPaths = [
    `/api/v1/content/detail?id=${encodeURIComponent(id)}`,
    `/api/v1/content/detail?content_id=${encodeURIComponent(id)}`,
    `/api/v1/posts/detail?id=${encodeURIComponent(id)}`,
    `/api/v1/reels/detail?id=${encodeURIComponent(id)}`,
  ]

  for (const path of directPaths) {
    try {
      const result = await getJson(`${BACKEND_URL}${path}`)
      const data = result.data

      if (result.ok && data?.detail !== "Not Found") {
        const item = data.item || data.post || data.reel || data.content || data.data
        if (item && (item.id || item.contentId || item.content_id)) {
          return NextResponse.json({
            success: true,
            item: normalize(item, item.kind || item.type || "post"),
            source: "direct",
            backend: `${BACKEND_URL}${path}`,
          })
        }
      }
    } catch {}
  }

  const homePaths = [
    "/api/v1/content/home-live",
    "/api/v1/content/feed",
    "/api/v1/home/live",
  ]

  for (const path of homePaths) {
    try {
      const result = await getJson(`${BACKEND_URL}${path}`)
      const data = result.data

      const posts = Array.isArray(data.posts) ? data.posts : []
      const reels = Array.isArray(data.reels) ? data.reels : []
      const stories = Array.isArray(data.stories) ? data.stories : []

      const all = [
        ...posts.map((x: any) => normalize(x, "post")),
        ...reels.map((x: any) => normalize(x, "reel")),
        ...stories.map((x: any) => normalize(x, "story")),
      ]

      const found = all.find((item: any) => sameId(item.id, id))

      if (found) {
        return NextResponse.json({
          success: true,
          item: found,
          source: "home-live-fallback",
          backend: `${BACKEND_URL}${path}`,
        })
      }
    } catch {}
  }

  return NextResponse.json({
    success: false,
    message: "Post not found in real backend data.",
    item: null,
    id,
    backend: BACKEND_URL,
  }, { status: 404 })
}
