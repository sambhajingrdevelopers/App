import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://13.206.145.54:8003';

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
      source: 'platform',
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
