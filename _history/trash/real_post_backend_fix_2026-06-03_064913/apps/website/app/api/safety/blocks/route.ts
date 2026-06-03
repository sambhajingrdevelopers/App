import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/safety/blocks`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'platform' : 'fallback',
      blocks: data.blocks || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      blocks: []
    });
  }
}
