import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/search/all?q=${encodeURIComponent(q)}`,
      { cache: 'no-store' }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'platform' : 'fallback',
      query: q,
      total: data.total || 0,
      creators: data.creators || [],
      posts: data.posts || [],
      reels: data.reels || [],
      stories: data.stories || [],
      results: data.results || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      query: q,
      total: 0,
      creators: [],
      posts: [],
      reels: [],
      stories: [],
      results: []
    });
  }
}
