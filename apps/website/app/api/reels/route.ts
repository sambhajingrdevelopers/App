import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackReels = [
  {
    id: 'REEL-101',
    title: 'Fashion Drop',
    creator: '@styleloop',
    caption: 'Premium fashion reel concept.',
    videoUrl: '',
    views: '1.2M',
    likes: '42K',
    comments: '1.1K',
    color: 'pink'
  },
  {
    id: 'REEL-102',
    title: 'Office Story',
    creator: '@founderhub',
    caption: 'Startup office creator moment.',
    videoUrl: '',
    views: '889K',
    likes: '28K',
    comments: '620',
    color: 'blue'
  },
  {
    id: 'REEL-103',
    title: 'Creator Life',
    creator: '@creatorlife',
    caption: 'Daily creator lifestyle reel.',
    videoUrl: '',
    views: '2.7M',
    likes: '91K',
    comments: '2.4K',
    color: 'purple'
  }
];

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/reels`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        reels: fallbackReels
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'platform',
      reels: data.reels || fallbackReels
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      reels: fallbackReels
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/reels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Reel create failed'
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'platform',
      reel: data.reel
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Reel server error'
      },
      { status: 500 }
    );
  }
}
