import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/v1/uploads`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.detail || data?.message || 'Upload failed'
        },
        { status: response.status }
      );
    }

    const mediaUrl =
      typeof data.mediaUrl === 'string' && data.mediaUrl.startsWith('/')
        ? `${BACKEND_URL}${data.mediaUrl}`
        : data.mediaUrl;

    return NextResponse.json({
      success: true,
      mediaUrl,
      mediaType: data.mediaType,
      fileName: data.fileName
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Upload server error'
      },
      { status: 500 }
    );
  }
}
