import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'change-this-secret-now';

function verifyToken(token: string) {
  const parts = token.split(':');

  if (parts.length !== 3) return false;

  const [email, timestamp, signature] = parts;
  const payload = `${email}:${timestamp}`;

  const expected = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('hex');

  const age = Date.now() - Number(timestamp);
  const maxAge = 1000 * 60 * 60 * 12;

  return signature === expected && age < maxAge;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('vibeloop_admin_session')?.value || '';

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      {
        success: false,
        authenticated: false
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true
  });
}
