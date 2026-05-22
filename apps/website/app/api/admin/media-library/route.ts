import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'CHANGE_ME_ADMIN_KEY';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/media/library`, {
      headers: {
        'X-Admin-Api-Key': ADMIN_API_KEY
      },
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'backend' : 'fallback',
      media: data.media || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      media: []
    });
  }
}
