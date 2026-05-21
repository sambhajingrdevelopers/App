import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackProfile = {
  displayName: 'VibeLoop Creator',
  username: '@you',
  bio: 'Digital creator • Reels • Stories',
  avatarUrl: '',
  bannerUrl: '',
  website: 'https://vibeloop.app',
  location: 'India',
  category: 'Digital Creator'
};

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/profile-settings`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'backend' : 'fallback',
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

    const response = await fetch(`${BACKEND_URL}/api/v1/profile-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Profile update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data.profile
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Profile server error' },
      { status: 500 }
    );
  }
}
