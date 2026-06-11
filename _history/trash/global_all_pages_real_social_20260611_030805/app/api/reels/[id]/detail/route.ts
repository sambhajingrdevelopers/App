import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

function proxy(url: any) {
  const clean = String(url || "").trim()
  if (!clean) return ""
  if (clean.startsWith("/api/media/proxy")) return clean
  if (clean.startsWith("data:")) return clean
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/media/")) {
    return `/api/media/proxy?url=${encodeURIComponent(clean)}`
  }
  return clean
}

function normalize(raw: any, fallbackType: "post" | "reel") {
  const item = raw || {}
  const usernameRaw = String(item.username || item.user || item.creator || "@creator")
  const username = usernameRaw.startsWith("@") ? usernameRaw : `@${usernameRaw}`
  const mediaRaw = item.mediaUrl || item.media_url || item.imageUrl || item.image_url || item.url || ""
  const videoRaw = item.videoUrl || item.video_url || ""
  const type = String(item.kind || item.type || fallbackType).toLowerCase()
  const mediaType = item.mediaType || item.media_type || (type === "reel" || videoRaw ? "video" : "image")

  return {
    ...item,
    id: String(item.id || item.contentId || item.postId || item.reelId || ""),
    kind: type,
    type,
    username,
    user: username,
    creator: username,
    name: item.name || username.replace("@", "") || "Creator",
    title: item.title || item.caption || (type === "reel" ? "Reel" : "Post"),
    caption: item.caption || item.title || "",
    location: item.location || "VibeLoop",
    mediaType,
    mediaUrl: proxy(mediaRaw || videoRaw),
    imageUrl: proxy(mediaRaw),
    videoUrl: proxy(videoRaw || (mediaType === "video" ? mediaRaw : "")),
    coverUrl: proxy(item.coverUrl || item.coverImage || ""),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || item.commentCount || 0),
    shares: Number(item.shares || item.shareCount || 0),
    views: Number(item.views || 0),
    liked: Boolean(item.liked),
    saved: Boolean(item.saved)
  }
}

async function readJson(res: Response) {
  const text = await res.text()
  try { return text ? JSON.parse(text) : {} } catch { return { success: false, message: text } }
}

async function getBackend(paths: string[]) {
  for (const path of paths) {
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" })
      const data = await readJson(res)
      const raw = data.item || data.post || data.reel || data.story || data.content || data.data

      if (res.ok && data.success !== false && raw) {
        return { ok: true, data, raw }
      }
    } catch {}
  }

  return { ok: false, data: {}, raw: null }
}
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const result = await getBackend([
    `/api/v1/content/detail?id=${encodeURIComponent(id)}`,
    `/api/v1/reels/${encodeURIComponent(id)}/detail`,
    `/api/v1/posts/${encodeURIComponent(id)}/detail`
  ])

  if (result.ok) {
    const reel = normalize(result.raw, "reel")
    return NextResponse.json({
      success: true,
      reel,
      post: reel,
      item: reel,
      comments: Array.isArray(result.data.comments) ? result.data.comments : []
    })
  }

  return NextResponse.json({ success: false, message: "Reel not found", reel: null, comments: [] }, { status: 200 })
}
