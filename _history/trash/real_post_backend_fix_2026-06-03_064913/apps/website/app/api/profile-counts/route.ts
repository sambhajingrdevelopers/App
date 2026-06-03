import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET(request: NextRequest) {
  try {
    const username =
      request.nextUrl.searchParams.get('username') ||
      request.cookies.get('vibeloop_username')?.value ||
      '@you';

    const response = await fetch(
      `${BACKEND_URL}/api/v1/profile/counts?username=${encodeURIComponent(username)}`,
      { cache: 'no-store' }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      counts: data.counts || {
        posts: 0,
        reels: 0,
        stories: 0,
        followers: 0
      }
    });
  } catch {
    return NextResponse.json({
      success: true,
      counts: {
        posts: 0,
        reels: 0,
        stories: 0,
        followers: 0
      }
    });
  }
}
