import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const username = request.cookies.get("vibeloop_username")?.value || body.username || "@you"
    const userId = request.cookies.get("vibeloop_user_id")?.value || body.userId || "USR-YOU"
    const name = request.cookies.get("vibeloop_name")?.value || body.name || "VibeLoop Creator"

    body.username = username
    body.user = username
    body.userId = userId
    body.name = name;

    const response = await fetch(`${BACKEND_URL}/api/v1/content/reel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Reel create failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reel: data.reel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Reel server error' },
      { status: 500 }
    );
  }
}
