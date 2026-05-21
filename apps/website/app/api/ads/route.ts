import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackAds = [
  { id: 'AD-501', title: 'Creator Boost Campaign', budget: '₹12,500', status: 'Running', progress: 72 },
  { id: 'AD-502', title: 'Reels Discovery Campaign', budget: '₹8,000', status: 'Scheduled', progress: 46 }
];

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/ads`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'backend' : 'fallback',
      ads: data.ads || fallbackAds
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      ads: fallbackAds
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Ad create failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ad: data.ad
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Ad server error' },
      { status: 500 }
    );
  }
}
