import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackStories = [
  { id: 'ST-101', name: 'Mira', username: '@mira.creates', mediaUrl: '', mediaType: 'image', caption: 'Creator studio morning.', views: 1240 },
  { id: 'ST-102', name: 'Dev', username: '@travel.dev', mediaUrl: '', mediaType: 'image', caption: 'Travel reel behind the scenes.', views: 980 },
  { id: 'ST-103', name: 'Sara', username: '@urban.snap', mediaUrl: '', mediaType: 'image', caption: 'Urban snap story.', views: 1540 }
];

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/stories`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        stories: fallbackStories
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'platform',
      stories: data.stories || fallbackStories
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      stories: fallbackStories
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/stories`, {
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
          message: data?.message || 'Story create failed'
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'platform',
      story: data.story
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Story server error'
      },
      { status: 500 }
    );
  }
}
