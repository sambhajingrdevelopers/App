import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username') || '@you';

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/profile-connections?username=${encodeURIComponent(username)}`,
      { cache: 'no-store' }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'backend' : 'fallback',
      followers: data.followers || [],
      following: data.following || [],
      followersCount: data.followersCount || 0,
      followingCount: data.followingCount || 0
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      followers: [],
      following: [],
      followersCount: 0,
      followingCount: 0
    });
  }
}
