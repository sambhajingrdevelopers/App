import { NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

function clean(item: any) {
  const video =
    item.videoUrl || item.video_url ||
    item.mediaUrl || item.media_url ||
    item.url || item.src || ""

  const usernameRaw = item.username || item.user || item.author || "creator"
  const username = String(usernameRaw).startsWith("@") ? String(usernameRaw) : `@${usernameRaw}`

  return {
    id: String(item.id || item.reel_id || ""),
    kind: "reel",
    type: "reel",
    title: item.title || "Reel",
    caption: item.caption || "",
    username,
    user: username,
    name: item.name || username.replace("@", ""),
    avatarUrl: item.avatarUrl || item.avatar_url || "",
    mediaUrl: video,
    media_url: video,
    videoUrl: video,
    video_url: video,
    mediaType: "video",
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    shares: Number(item.shares || 0),
    views: Number(item.views || 0),
    createdAt: item.createdAt || item.created_at || "",
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/reels`, { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    const reels = (data.reels || data.items || data.data || []).map(clean).filter((x: any) => x.videoUrl)

    return NextResponse.json({ success: true, source: "safe-reels", reels })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || "Reels failed", reels: [] })
  }
}
