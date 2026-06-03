import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await fetch(`${BACKEND_URL}/api/v1/posts/${encodeURIComponent(params.id)}/shares`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: response.ok && data.success,
      shareCount: data.shareCount || 0,
      shares: data.shares || []
    });
  } catch {
    return NextResponse.json({
      success: false,
      shareCount: 0,
      shares: []
    });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${BACKEND_URL}/api/v1/posts/${encodeURIComponent(params.id)}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Share failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      share: data.share,
      shareCount: data.shareCount
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Share server error' },
      { status: 500 }
    );
  }
}
