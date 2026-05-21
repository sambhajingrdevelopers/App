import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const params = await context.params;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/posts/${encodeURIComponent(params.id)}/comments/${encodeURIComponent(params.commentId)}`,
      {
        method: 'DELETE',
        cache: 'no-store'
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Delete comment failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comments: data.comments || [],
      post: data.post
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Delete server error' },
      { status: 500 }
    );
  }
}
