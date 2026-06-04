import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/content/stories-live`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'platform' : 'fallback',
      stories: proxifyMedia(data.stories || [])
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      stories: []
    });
  }
}
