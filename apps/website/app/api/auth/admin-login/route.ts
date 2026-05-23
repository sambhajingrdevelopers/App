import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Admin login failed' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      user: data.user
    });

    res.cookies.set('vibeloop_admin_token', data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Login server error' },
      { status: 500 }
    );
  }
}
