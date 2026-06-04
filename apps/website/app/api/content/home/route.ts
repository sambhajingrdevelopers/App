import { NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://13.206.145.54:8003"

function normalize(item: any, fallbackKind: string) {
  const kind = item.kind || item.type || fallbackKind
  const mediaUrl = item.mediaUrl || item.media_url || item.videoUrl || item.video_url || ""
  const videoUrl = item.videoUrl || item.video_url || ""

  return {
    id: String(item.id || ""),
    kind,
    type: kind,
    title: item.title || kind,
    caption: item.caption || item.description || "",
    username: item.username || item.user || item.creator || "@creator",
    user: item.user || item.username || "@creator",
    name: item.name || item.username || "Creator",
    avatarUrl: proxifyUrl( item.avatarUrl || item.avatar_url || ""),
    mediaUrl: proxifyUrl(mediaUrl),
    videoUrl: proxifyUrl(videoUrl),
    mediaType: item.mediaType || item.media_type || (videoUrl ? "video" : "image"),
    likes: item.likes || 0,
    comments: item.comments || 0,
    views: item.views || 0,
    createdAt: item.createdAt || item.created_at || "",
    archivedAt: item.archivedAt || item.archived_at || ""
  }
}

function activeOnly(item: any) {
  return !item.archivedAt
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

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/content/home-live`, {
      cache: "no-store"
    })

    const data = await response.json().catch(() => ({}))

    const posts = (Array.isArray(data.posts) ? data.posts : [])
      .map((item: any) => normalize(item, "post"))
      .filter(activeOnly)

    const reels = (Array.isArray(data.reels) ? data.reels : [])
      .map((item: any) => normalize(item, "reel"))
      .filter(activeOnly)

    const stories = (Array.isArray(data.stories) ? data.stories : [])
      .map((item: any) => normalize(item, "story"))
      .filter(activeOnly)

    return NextResponse.json({
      success: true,
      source: "backend-home-clean",
      posts,
      reels,
      stories
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Home feed failed.",
      posts: [],
      reels: [],
      stories: []
    })
  }
}
