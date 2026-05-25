import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

function includesQuery(value: any, query: string) {
  return String(value || "").toLowerCase().includes(query.toLowerCase())
}

function normalizeUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return "@creator"
  return clean.startsWith("@") ? clean : `@${clean}`
}

async function getJson(path: string) {
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" })
    return await response.json()
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  const q = String(request.nextUrl.searchParams.get("q") || "").trim()
  const username = request.cookies.get("vibeloop_username")?.value || "@you"

  if (!q) {
    return NextResponse.json({
      success: true,
      source: "empty",
      query: q,
      results: []
    })
  }

  const [homeData, reelsData, storiesData, followingData] = await Promise.all([
    getJson("/api/v1/content/home-live"),
    getJson("/api/v1/content/reels-live"),
    getJson("/api/v1/content/stories-live"),
    getJson(`/api/v1/following?username=${encodeURIComponent(username)}`)
  ])

  const posts = Array.isArray(homeData.posts) ? homeData.posts : []
  const reels = Array.isArray(reelsData.reels)
    ? reelsData.reels
    : Array.isArray(homeData.reels)
      ? homeData.reels
      : []

  const stories = Array.isArray(storiesData.stories)
    ? storiesData.stories
    : Array.isArray(homeData.stories)
      ? homeData.stories
      : []

  const creators = Array.isArray(followingData.users) ? followingData.users : []

  const creatorResults = creators
    .filter((user: any) =>
      includesQuery(user.name, q) ||
      includesQuery(user.username, q)
    )
    .map((user: any) => ({
      id: user.id || user.username,
      type: "creator",
      title: user.name || user.username || "Creator",
      name: user.name || user.username || "Creator",
      username: normalizeUsername(user.username),
      caption: user.online ? "Online creator" : "Creator profile",
      avatarUrl: user.avatarUrl || ""
    }))

  const postResults = posts
    .filter((post: any) =>
      includesQuery(post.title, q) ||
      includesQuery(post.caption, q) ||
      includesQuery(post.user, q) ||
      includesQuery(post.username, q) ||
      includesQuery(post.name, q) ||
      includesQuery(post.location, q)
    )
    .map((post: any) => ({
      id: post.id,
      type: "post",
      title: post.title || "Post",
      name: post.name || post.user || "Creator",
      username: normalizeUsername(post.user || post.username),
      caption: post.caption || post.location || "Post update",
      mediaUrl: post.mediaUrl || "",
      likes: post.likes || 0
    }))

  const reelResults = reels
    .filter((reel: any) =>
      includesQuery(reel.title, q) ||
      includesQuery(reel.caption, q) ||
      includesQuery(reel.creator, q) ||
      includesQuery(reel.username, q) ||
      includesQuery(reel.name, q)
    )
    .map((reel: any) => ({
      id: reel.id,
      type: "reel",
      title: reel.title || "Reel",
      name: reel.name || reel.creator || "Creator",
      username: normalizeUsername(reel.username || reel.creator),
      caption: reel.caption || "Reel video",
      mediaUrl: reel.videoUrl || reel.mediaUrl || "",
      views: reel.views || 0
    }))

  const storyResults = stories
    .filter((story: any) =>
      includesQuery(story.title, q) ||
      includesQuery(story.caption, q) ||
      includesQuery(story.name, q) ||
      includesQuery(story.username, q)
    )
    .map((story: any) => ({
      id: story.id,
      type: "story",
      title: story.title || story.name || "Story",
      name: story.name || "Creator",
      username: normalizeUsername(story.username),
      caption: story.caption || "Story update",
      mediaUrl: story.mediaUrl || ""
    }))

  const results = [
    ...creatorResults,
    ...postResults,
    ...reelResults,
    ...storyResults
  ].slice(0, 60)

  return NextResponse.json({
    success: true,
    source: "backend-live",
    query: q,
    counts: {
      creators: creatorResults.length,
      posts: postResults.length,
      reels: reelResults.length,
      stories: storyResults.length
    },
    results
  })
}
