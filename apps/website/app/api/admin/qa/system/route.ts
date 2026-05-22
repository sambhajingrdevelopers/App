import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'CHANGE_ME_ADMIN_KEY';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/system/qa`, {
      headers: {
        'X-Admin-Api-Key': ADMIN_API_KEY
      },
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: response.ok && data.success,
      source: response.ok ? 'backend' : 'fallback',
      ...data
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      source: 'fallback',
      message: error?.message || 'QA server error',
      routes: { missingTotal: 0, checks: [] },
      databases: {},
      media: {},
      environment: {},
      warnings: ['Frontend could not reach backend QA endpoint.']
    });
  }
}
