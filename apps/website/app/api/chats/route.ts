import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackChats = [
  {
    id: 'CHAT-101',
    name: 'Mira',
    username: '@mira.creates',
    avatar: 'M',
    lastMessage: 'Design looks powerful 🔥',
    unread: 2,
    messages: [
      { id: 'MSG-101', chatId: 'CHAT-101', sender: 'them', text: 'Design looks powerful 🔥' },
      { id: 'MSG-102', chatId: 'CHAT-101', sender: 'me', text: 'Yes, now we are making it real.' },
      { id: 'MSG-103', chatId: 'CHAT-101', sender: 'them', text: 'Add reels and creator dashboard next.' }
    ]
  },
  {
    id: 'CHAT-102',
    name: 'Dev',
    username: '@travel.dev',
    avatar: 'D',
    lastMessage: 'Send me the reel preview.',
    unread: 0,
    messages: [
      { id: 'MSG-201', chatId: 'CHAT-102', sender: 'them', text: 'Send me the reel preview.' }
    ]
  }
];

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/chats`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        chats: fallbackChats
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'platform',
      chats: data.chats || fallbackChats
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      chats: fallbackChats
    });
  }
}
