import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/saved-posts`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        posts: []
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'backend',
      posts: data.posts || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      posts: []
    });
  }
}
