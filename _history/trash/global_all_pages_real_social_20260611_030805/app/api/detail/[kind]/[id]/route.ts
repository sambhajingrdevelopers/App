import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

type Kind = "post" | "reel" | "story"

function proxyMedia(url: any) {
  const clean = String(url || "").trim()
  if (!clean) return ""
  if (clean.startsWith("/api/media/proxy")) return clean
  if (clean.startsWith("data:")) return clean
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/media/")) {
    return `/api/media/proxy?url=${encodeURIComponent(clean)}`
  }
  return clean
}

function itemId(item: any) {
  return String(
    item?.id ||
    item?.contentId ||
    item?.content_id ||
    item?.postId ||
    item?.post_id ||
    item?.reelId ||
    item?.reel_id ||
    item?.storyId ||
    item?.story_id ||
    item?.slug ||
    ""
  )
}

function collectItems(value: any, out: any[] = []) {
  if (!value) return out
  if (Array.isArray(value)) {
    value.forEach((x) => collectItems(x, out))
    return out
  }
  if (typeof value === "object") {
    if (itemId(value)) out.push(value)
    Object.values(value).forEach((x) => {
      if (Array.isArray(x)) collectItems(x, out)
    })
  }
  return out
}

function normalize(raw: any, kind: Kind) {
  const item = raw || {}
  const usernameRaw = String(item.username || item.user || item.creator || item.handle || "@creator")
  const username = usernameRaw.startsWith("@") ? usernameRaw : `@${usernameRaw}`

  const typeRaw = String(item.kind || item.type || item.mediaKind || kind).toLowerCase()
  const finalKind: Kind =
    typeRaw.includes("reel") || kind === "reel"
      ? "reel"
      : typeRaw.includes("story") || kind === "story"
        ? "story"
        : "post"

  const imageRaw =
    item.mediaUrl ||
    item.media_url ||
    item.imageUrl ||
    item.image_url ||
    item.thumbnailUrl ||
    item.thumbnail_url ||
    item.coverUrl ||
    item.cover_url ||
    item.url ||
    ""

  const videoRaw =
    item.videoUrl ||
    item.video_url ||
    item.reelUrl ||
    item.reel_url ||
    ""

  const mediaType =
    item.mediaType ||
    item.media_type ||
    (finalKind === "reel" || videoRaw ? "video" : "image")

  return {
    ...item,
    id: itemId(item),
    kind: finalKind,
    type: finalKind,
    username,
    user: username,
    creator: username,
    name: item.name || item.displayName || username.replace("@", "") || "Creator",
    title: item.title || item.caption || (finalKind === "reel" ? "Reel" : finalKind === "story" ? "Story" : "Post"),
    caption: item.caption || item.title || "",
    location: item.location || "VibeLoop",
    mediaType,
    mediaUrl: proxyMedia(imageRaw || videoRaw),
    imageUrl: proxyMedia(imageRaw),
    videoUrl: proxyMedia(videoRaw || (mediaType === "video" ? imageRaw : "")),
    coverUrl: proxyMedia(item.coverUrl || item.cover_url || imageRaw),
    likes: Number(item.likes || item.likeCount || 0),
    comments: Number(item.comments || item.commentCount || 0),
    shares: Number(item.shares || item.shareCount || 0),
    views: Number(item.views || item.viewCount || 0),
    liked: Boolean(item.liked),
    saved: Boolean(item.saved),
    createdAt: item.createdAt || item.created_at || ""
  }
}

async function readJson(res: Response) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { success: false, message: text || "Invalid JSON" }
  }
}

async function fetchBackend(path: string) {
  const url = `${BACKEND_URL}${path}`
  try {
    const res = await fetch(url, { cache: "no-store" })
    const data = await readJson(res)
    return { ok: res.ok && data?.success !== false, data, url }
  } catch (e: any) {
    return { ok: false, data: { message: e?.message || "fetch failed" }, url }
  }
}

export async function GET(_request: Request, context: { params: Promise<{ kind: Kind; id: string }> }) {
  const { kind, id } = await context.params
  const cleanKind: Kind = kind === "reel" || kind === "story" ? kind : "post"

  const directPaths = [
    `/api/v1/content/detail?id=${encodeURIComponent(id)}`,
    `/api/v1/${cleanKind}s/${encodeURIComponent(id)}/detail`,
    `/api/v1/${cleanKind}/${encodeURIComponent(id)}`,
    `/api/v1/posts/${encodeURIComponent(id)}/detail`,
    `/api/v1/reels/${encodeURIComponent(id)}/detail`,
    `/api/v1/stories/${encodeURIComponent(id)}/detail`
  ]

  for (const path of directPaths) {
    const result = await fetchBackend(path)
    const raw =
      result.data?.item ||
      result.data?.post ||
      result.data?.reel ||
      result.data?.story ||
      result.data?.content ||
      result.data?.data

    if (result.ok && raw && itemId(raw)) {
      const item = normalize(raw, cleanKind)
      return NextResponse.json({
        success: true,
        item,
        post: item,
        reel: item,
        story: item,
        comments: Array.isArray(result.data?.comments) ? result.data.comments : []
      })
    }
  }

  const listPaths = [
    "/api/v1/content/home-live",
    "/api/v1/content/reels-live",
    "/api/v1/content/stories-live",
    "/api/v1/posts",
    "/api/v1/reels",
    "/api/v1/stories"
  ]

  for (const path of listPaths) {
    const result = await fetchBackend(path)
    const items = collectItems(result.data)
    const found = items.find((x) => itemId(x) === id)

    if (found) {
      const item = normalize(found, cleanKind)
      return NextResponse.json({
        success: true,
        item,
        post: item,
        reel: item,
        story: item,
        comments: Array.isArray(found.commentsList) ? found.commentsList : []
      })
    }
  }

  return NextResponse.json({
    success: false,
    message: `${cleanKind} not found`,
    item: null,
    post: null,
    reel: null,
    story: null,
    comments: []
  }, { status: 200 })
}
