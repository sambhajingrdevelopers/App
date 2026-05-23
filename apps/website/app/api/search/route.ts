import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  const fallback = {
    success: true,
    source: 'fallback',
    query: q,
    results: [
      {
        type: 'creator',
        id: 'CR-101',
        title: 'Mira Creates',
        subtitle: '@mira.creates • Digital Creator',
        meta: '52800 followers',
        href: '/explore'
      },
      {
        type: 'reel',
        id: 'REEL-101',
        title: 'Fashion Drop',
        subtitle: '@styleloop • Premium fashion reel concept',
        meta: '1.2M views',
        href: '/reels'
      }
    ].filter((item) =>
      `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(q.toLowerCase())
    )
  };

  if (!q.trim()) {
    return NextResponse.json({
      success: true,
      source: 'empty',
      query: q,
      results: []
    });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/search?q=${encodeURIComponent(q)}`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'platform',
      query: q,
      results: data.results || []
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
