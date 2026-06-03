import { NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://43.205.145.63:8003"

function normalize(item: any) {
  const videoUrl = item.videoUrl || item.video_url || ""
  const mediaUrl = item.mediaUrl || item.media_url || videoUrl || ""

  return {
    id: String(item.id || ""),
    kind: "reel",
    type: "reel",
    title: item.title || "Reel",
    caption: item.caption || "",
    username: item.username || item.user || "@creator",
    user: item.user || item.username || "@creator",
    name: item.name || item.username || "Creator",
    avatarUrl: item.avatarUrl || item.avatar_url || "",
    mediaUrl,
    videoUrl,
    mediaType: "video",
    likes: item.likes || 0,
    comments: item.comments || 0,
    views: item.views || 0,
    createdAt: item.createdAt || item.created_at || "",
    archivedAt: item.archivedAt || item.archived_at || ""
  }
}

export async function GET() {
  try {
    let response = await fetch(`${BACKEND_URL}/api/v1/content/reels-live`, {
      cache: "no-store"
    })

    let data = await response.json().catch(() => ({}))

    if (!Array.isArray(data.reels)) {
      response = await fetch(`${BACKEND_URL}/api/v1/content/home-live`, {
        cache: "no-store"
      })
      data = await response.json().catch(() => ({}))
    }

    const reels = (Array.isArray(data.reels) ? data.reels : [])
      .map(normalize)
      .filter((item: any) => item.id && !item.archivedAt)

    return NextResponse.json({
      success: true,
      source: "backend-reels-clean",
      reels
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Reels backend failed.",
      reels: []
    }, { status: 500 })
  }
}
