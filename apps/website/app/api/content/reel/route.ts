import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://13.206.145.54:8003';


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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const username = request.cookies.get("vibeloop_username")?.value || body.username || "@you"
    const userId = request.cookies.get("vibeloop_user_id")?.value || body.userId || "USR-YOU"
    const name = request.cookies.get("vibeloop_name")?.value || body.name || "VibeLoop Creator"

    body.username = username
    body.user = username
    body.userId = userId
    body.name = name;

    const response = await fetch(`${BACKEND_URL}/api/v1/content/reel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Reel create failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reel: data.reel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Reel server error' },
      { status: 500 }
    );
  }
}
