import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

function mediaProxy(url: any) {
  const clean = String(url || "").trim()
  if (!clean) return ""
  if (clean.startsWith("/api/media/proxy")) return clean
  if (clean.startsWith("data:")) return clean
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/media/")) {
    return `/api/media/proxy?url=${encodeURIComponent(clean)}`
  }
  return clean
}

function asArray(value: any) {
  return Array.isArray(value) ? value : []
}

function normalizeItem(item: any) {
  const source = item || {}
  const id = String(source.id || source.contentId || source.content_id || source.postId || source.reelId || "")
  const rawType = String(source.kind || source.type || source.mediaKind || "").toLowerCase()
  const mediaUrlRaw = source.mediaUrl || source.media_url || source.imageUrl || source.image_url || source.url || ""
  const videoUrlRaw = source.videoUrl || source.video_url || ""
  const finalType = rawType || (videoUrlRaw ? "reel" : "post")
  const mediaType = source.mediaType || source.media_type || (finalType === "reel" || videoUrlRaw ? "video" : "image")
  const usernameRaw = String(source.username || source.user || source.creator || "@creator")
  const username = usernameRaw.startsWith("@") ? usernameRaw : `@${usernameRaw}`

  return {
    ...source,
    id,
    kind: finalType,
    type: finalType,
    mediaType,
    mediaUrl: mediaProxy(mediaUrlRaw || videoUrlRaw),
    media_url: mediaProxy(mediaUrlRaw || videoUrlRaw),
    imageUrl: mediaProxy(mediaUrlRaw),
    videoUrl: mediaProxy(videoUrlRaw || (mediaType === "video" ? mediaUrlRaw : "")),
    video_url: mediaProxy(videoUrlRaw || (mediaType === "video" ? mediaUrlRaw : "")),
    coverUrl: mediaProxy(source.coverUrl || source.cover_url || source.coverImage || ""),
    coverImage: mediaProxy(source.coverImage || source.coverUrl || ""),
    avatarUrl: mediaProxy(source.avatarUrl || source.avatar_url || ""),
    username,
    user: username,
    name: source.name || username.replace("@", "") || "Creator",
    title: source.title || source.caption || (finalType === "reel" ? "Reel" : "Post"),
    caption: source.caption || source.title || "",
    location: source.location || "VibeLoop",
    likes: Number(source.likes || 0),
    comments: Number(source.comments || 0),
    shares: Number(source.shares || 0),
    views: Number(source.views || 0),
    createdAt: source.createdAt || source.created_at || ""
  }
}

async function readJson(response: Response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { success: false, message: text || "Invalid JSON" }
  }
}

async function fetchBackend(path: string) {
  const url = `${BACKEND_URL}${path}`
  try {
    const response = await fetch(url, { cache: "no-store" })
    const data = await readJson(response)
    return { ok: response.ok, status: response.status, url, data }
  } catch (error: any) {
    return { ok: false, status: 502, url, data: { success: false, message: error?.message || "Backend fetch failed" } }
  }
}

export async function GET() {
  const result = await fetchBackend("/api/v1/content/home-live")
  const data = result.data || {}

  const posts = asArray(data.posts).map(normalizeItem)
  const reels = asArray(data.reels).map(normalizeItem)
  const stories = asArray(data.stories).map(normalizeItem)

  const feed = [...posts, ...reels].sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)))

  return NextResponse.json({
    success: result.ok && data.success !== false,
    message: result.ok ? "OK" : data.message || "Backend not reachable",
    backendUrl: result.url,
    posts,
    reels,
    stories,
    feed
  })
}
