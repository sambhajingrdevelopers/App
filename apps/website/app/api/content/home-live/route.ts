import { NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

function clean(item: any, fallback: string) {
  const media =
    item.mediaUrl || item.media_url ||
    item.imageUrl || item.image_url ||
    item.videoUrl || item.video_url ||
    item.url || item.src || ""

  const video =
    item.videoUrl || item.video_url ||
    (String(media).match(/\.(mp4|webm|mov|m4v)(\?|$)/i) ? media : "")

  const usernameRaw = item.username || item.user || item.author || item.creator || "creator"
  const username = String(usernameRaw).startsWith("@") ? String(usernameRaw) : `@${usernameRaw}`

  return {
    id: String(item.id || item.post_id || item.reel_id || ""),
    kind: item.kind || item.type || fallback,
    type: item.kind || item.type || fallback,
    title: item.title || fallback,
    caption: item.caption || item.description || "",
    username,
    user: username,
    name: item.name || username.replace("@", ""),
    avatarUrl: item.avatarUrl || item.avatar_url || "",
    mediaUrl: media,
    media_url: media,
    imageUrl: item.imageUrl || item.image_url || media,
    videoUrl: video,
    video_url: video,
    mediaType: item.mediaType || item.media_type || (video ? "video" : "image"),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    shares: Number(item.shares || 0),
    views: Number(item.views || 0),
    createdAt: item.createdAt || item.created_at || "",
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/social/home`, { cache: "no-store" })
    const data = await res.json().catch(() => ({}))

    const posts = (data.posts || []).map((x: any) => clean(x, "post"))
    const reels = (data.reels || []).map((x: any) => clean(x, "reel"))
    const stories = (data.stories || [])

    return NextResponse.json({
      success: true,
      source: "safe-social-home",
      posts,
      reels,
      stories,
      creators: data.creators || data.users || [],
      users: data.users || data.creators || [],
      feed: data.feed || [...posts, ...reels],
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Home feed failed",
      posts: [],
      reels: [],
      stories: [],
    })
  }
}
