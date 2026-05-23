import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackProfile = {
  displayName: 'VibeLoop Creator',
  username: '@you',
  bio: 'Digital creator • Reels • Stories',
  avatarUrl: '',
  bannerUrl: '',
  isOwn: true,
  isFollowing: false,
  stats: {
    posts: 0,
    reels: 0,
    stories: 0,
    followers: 52800,
    following: 0,
    saved: 0,
    likes: 0,
    views: 0
  }
};

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username') || '@you';

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/profile-dynamic?username=${encodeURIComponent(username)}`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        profile: fallbackProfile,
        posts: [],
        reels: [],
        stories: []
      });
    }

    return NextResponse.json({
      success: true,
      source: 'platform',
      profile: data.profile || fallbackProfile,
      posts: data.posts || [],
      reels: data.reels || [],
      stories: data.stories || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      profile: fallbackProfile,
      posts: [],
      reels: [],
      stories: []
    });
  }
}
