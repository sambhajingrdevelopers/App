import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vibeloop_admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not logged in' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Invalid session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Auth server error' },
      { status: 500 }
    );
  }
}
