import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/chats/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: body.chatId,
        text: body.text,
        sender: body.sender || 'me'
      }),
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Message send failed'
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'backend',
      message: data.message
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Message server error'
      },
      { status: 500 }
    );
  }
}
