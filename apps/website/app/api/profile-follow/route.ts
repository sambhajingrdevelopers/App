import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/profile-follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: body.username,
        follow: body.follow
      }),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Follow update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      creator: data.creator,
      followingCount: data.followingCount
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Follow server error' },
      { status: 500 }
    );
  }
}
