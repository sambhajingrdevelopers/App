import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003'\;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const oldUsername = request.cookies.get('vibeloop_username')?.value || body.oldUsername || '@you';

    const response = await fetch(`${BACKEND_URL}/api/v1/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, oldUsername }),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Profile update failed.' },
        { status: 400 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: data.message,
      user: data.user
    });

    res.cookies.set('vibeloop_username', data.user.username, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Profile update error.' },
      { status: 500 }
    );
  }
}
