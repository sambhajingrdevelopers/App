import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET(request: NextRequest) {
  try {
    const username = request.cookies.get('vibeloop_username')?.value || '@you';

    const response = await fetch(
      `${BACKEND_URL}/api/v1/me?username=${encodeURIComponent(username)}`,
      { cache: 'no-store' }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      user: data.user || {
        userId: 'USR-YOU',
        id: 'USR-YOU',
        name: 'VibeLoop Creator',
        username: '@you',
        verified: true,
        followers: 0,
        bio: 'Digital creator'
      }
    });
  } catch {
    return NextResponse.json({
      success: true,
      user: {
        userId: 'USR-YOU',
        id: 'USR-YOU',
        name: 'VibeLoop Creator',
        username: '@you',
        verified: true,
        followers: 0,
        bio: 'Digital creator'
      }
    });
  }
}
