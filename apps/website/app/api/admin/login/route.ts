import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vibeloop.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'change-this-secret-now';

function signToken(email: string) {
  const payload = `${email}:${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('hex');

  return `${payload}:${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid admin email or password'
        },
        { status: 401 }
      );
    }

    const token = signToken(body.email);

    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful'
    });

    response.cookies.set('vibeloop_admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Admin login server error'
      },
      { status: 500 }
    );
  }
}
