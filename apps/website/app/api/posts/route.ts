import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/posts`, {
      method: 'GET',
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        platformReady: false,
        posts: []
      });
    }

    return NextResponse.json({
      success: true,
      platformReady: true,
      posts: data?.posts || data || []
    });
  } catch {
    return NextResponse.json({
      success: false,
      platformReady: false,
      posts: []
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        platformReady: false,
        message: data?.detail || data?.message || 'Live post endpoint not ready',
        post: body
      });
    }

    return NextResponse.json({
      success: true,
      platformReady: true,
      post: data?.post || data
    });
  } catch {
    return NextResponse.json({
      success: false,
      platformReady: false,
      message: 'Live unavailable',
      post: null
    });
  }
}
