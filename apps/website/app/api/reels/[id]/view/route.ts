import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await fetch(`${BACKEND_URL}/api/v1/reels/${encodeURIComponent(params.id)}/view`, {
      method: 'POST',
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: response.ok && data.success,
      reel: data.reel
    });
  } catch {
    return NextResponse.json({ success: false });
  }
}
