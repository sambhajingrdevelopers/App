import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackData = {
  source: 'fallback',
  stories: ['You', 'Mira', 'Dev', 'Sara', 'Aarav', 'Zayn', 'Riya'],
  posts: [
    {
      id: 1,
      user: '@mira.creates',
      name: 'Mira',
      location: 'Mumbai',
      title: 'Creator Studio Setup',
      caption: 'A premium creator workspace built for posts, reels, stories and audience growth.',
      likes: '12.8K',
      comments: '342',
      color: 'pink'
    },
    {
      id: 2,
      user: '@travel.dev',
      name: 'Dev',
      location: 'Pune Hills',
      title: 'Travel Reel Moment',
      caption: 'Discover short-form creator content with a clean and immersive reels experience.',
      likes: '8.4K',
      comments: '119',
      color: 'blue'
    },
    {
      id: 3,
      user: '@urban.snap',
      name: 'Sara',
      location: 'Bengaluru',
      title: 'Urban Creator Drop',
      caption: 'A premium post interface designed for creator engagement and brand discovery.',
      likes: '21.1K',
      comments: '901',
      color: 'purple'
    }
  ]
};

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/feed`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(fallbackData);
    }

    const data = await response.json();

    return NextResponse.json({
      source: 'backend',
      stories: data?.stories?.length ? data.stories : fallbackData.stories,
      posts: data?.posts?.length ? data.posts : fallbackData.posts
    });
  } catch {
    return NextResponse.json(fallbackData);
  }
}
