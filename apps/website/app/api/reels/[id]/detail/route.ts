import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await fetch(`${BACKEND_URL}/api/v1/reels/${encodeURIComponent(params.id)}/detail`, {
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Reel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reel: data.reel,
      comments: data.comments || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Reel server error' },
      { status: 500 }
    );
  }
}
