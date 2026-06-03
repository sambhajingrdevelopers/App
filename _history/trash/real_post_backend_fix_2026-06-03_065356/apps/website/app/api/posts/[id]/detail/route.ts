import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://13.206.145.54:8003";

function normalizePost(item: any) {
  const username = String(item?.username || item?.user || item?.owner || '@creator').trim();
  const finalUsername = username.startsWith('@') ? username : `@${username}`;
  const mediaUrl = item?.mediaUrl || item?.media_url || item?.imageUrl || item?.image_url || item?.videoUrl || item?.video_url || '';
  const videoUrl = item?.videoUrl || item?.video_url || '';
  const mediaType = item?.mediaType || item?.media_type || (videoUrl || String(mediaUrl).match(/\.(mp4|webm|mov)(\?|$)/i) ? 'video' : 'image');

  return {
    id: String(item?.id || item?.contentId || item?.content_id || ''),
    kind: item?.kind || item?.type || 'post',
    type: item?.kind || item?.type || 'post',
    user: finalUsername,
    username: finalUsername,
    name: item?.name || finalUsername.replace('@', '') || 'Creator',
    location: item?.location || 'VibeLoop',
    title: item?.title || item?.caption || 'Creator Post',
    caption: item?.caption || '',
    likes: Number(item?.likes || 0),
    comments: Number(item?.comments || 0),
    shares: Number(item?.shares || 0),
    views: Number(item?.views || 0),
    color: item?.color || 'pink',
    mediaUrl,
    videoUrl,
    mediaType,
    liked: Boolean(item?.liked),
    saved: Boolean(item?.saved),
    commentList: Array.isArray(item?.commentList) ? item.commentList : [],
    createdAt: item?.createdAt || item?.created_at || ''
  };
}

async function safeJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, message: text || 'Invalid backend JSON' };
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = encodeURIComponent(params.id);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/posts/${id}/detail`, {
        cache: 'no-store'
      });
      const data = await safeJson(response);

      if (response.ok && data?.success && data?.post) {
        return NextResponse.json({
          success: true,
          source: 'posts-detail',
          post: normalizePost(data.post),
          comments: data.comments || data.post?.commentList || []
        });
      }
    } catch {}

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/content/detail?id=${id}`, {
        cache: 'no-store'
      });
      const data = await safeJson(response);
      const item = data?.item || data?.post || data?.reel || data?.story || data?.content || data?.data;

      if (response.ok && data?.success && item) {
        return NextResponse.json({
          success: true,
          source: 'content-detail',
          post: normalizePost(item),
          comments: item.commentList || []
        });
      }
    } catch {}

    return NextResponse.json(
      {
        success: false,
        message: 'Post not found in EC2 real backend.',
        backend: BACKEND_URL
      },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Post detail server error', backend: BACKEND_URL },
      { status: 500 }
    );
  }
}
