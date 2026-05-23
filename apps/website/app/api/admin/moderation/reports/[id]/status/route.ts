import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'CHANGE_ME_ADMIN_KEY';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/admin/safety/reports/${params.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Api-Key': ADMIN_API_KEY },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Report update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, report: data.report });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Report server error' },
      { status: 500 }
    );
  }
}
