import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackProfile = {
  displayName: 'VibeLoop Creator',
  username: '@you',
  bio: 'Digital creator • Reels • Stories • Brand collaborations',
  avatarUrl: '',
  bannerUrl: ''
};

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/profile`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        profile: fallbackProfile
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'platform',
      profile: data.profile || fallbackProfile
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      profile: fallbackProfile
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.detail || data?.message || 'Profile save failed'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'platform',
      profile: data.profile
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Profile server error'
      },
      { status: 500 }
    );
  }
}
