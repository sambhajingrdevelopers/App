import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/v1/upload`, {
      method: 'POST',
      body: formData,
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Upload failed'
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      media: data.media,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType
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
