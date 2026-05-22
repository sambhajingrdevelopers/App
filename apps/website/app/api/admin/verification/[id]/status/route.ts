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

    const response = await fetch(
      `${BACKEND_URL}/api/v1/admin/verification/${params.id}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'X-Admin-Api-Key': ADMIN_API_KEY },
        body: JSON.stringify({
          status: body.status
        }),
        cache: 'no-store'
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.detail || data?.message || 'Verification update failed'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Verification update server error'
      },
      { status: 500 }
    );
  }
}
