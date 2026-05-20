import { Chat, NotificationItem, Post, Reel, Story } from '../types/social';

export const stories: Story[] = [
  {
    id: '1',
    name: 'You',
    username: 'you',
    avatarColor: '#ff2d95',
    hasNewStory: false
  },
  {
    id: '2',
    name: 'Aarav',
    username: 'aaravx',
    avatarColor: '#7c3aed',
    hasNewStory: true
  },
  {
    id: '3',
    name: 'Mira',
    username: 'mira.creates',
    avatarColor: '#00d4ff',
    hasNewStory: true,
    isLive: true
  },
  {
    id: '4',
    name: 'Dev',
    username: 'travel.dev',
    avatarColor: '#22c55e',
    hasNewStory: true
  },
  {
    id: '5',
    name: 'Sara',
    username: 'sara.snap',
    avatarColor: '#f59e0b',
    hasNewStory: true
  },
  {
    id: '6',
    name: 'Zayn',
    username: 'zayn.world',
    avatarColor: '#ef4444',
    hasNewStory: false
  }
];

export const posts: Post[] = [
  {
    id: 'p1',
    user: 'mira.creates',
    name: 'Mira',
    location: 'Mumbai, India',
    caption: 'Building a new creator world with VibeLoop 🚀 Premium social experience is loading.',
    likes: '12.8K',
    comments: '342',
    shares: '91',
    saves: '1.2K',
    color: '#ff2d95',
    verified: true,
    createdAt: '2 min ago'
  },
  {
    id: 'p2',
    user: 'travel.dev',
    name: 'Dev',
    location: 'Pune Hills',
    caption: 'Morning view, fresh air, and a clean dynamic UI mood.',
    likes: '8.4K',
    comments: '119',
    shares: '48',
    saves: '889',
    color: '#00d4ff',
    verified: false,
    createdAt: '18 min ago'
  },
  {
    id: 'p3',
    user: 'urban.snap',
    name: 'Sara',
    location: 'Bengaluru',
    caption: 'Reels, stories, posts, chat, creator dashboard — everything in one advanced app.',
    likes: '21.1K',
    comments: '901',
    shares: '302',
    saves: '3.8K',
    color: '#7c3aed',
    verified: true,
    createdAt: '1 hour ago'
  }
];

export const reels: Reel[] = [
  {
    id: 'r1',
    title: 'Street fashion reel',
    creator: '@styleloop',
    views: '1.2M',
    likes: '98K',
    color: '#ff2d95'
  },
  {
    id: 'r2',
    title: 'Startup office vlog',
    creator: '@founderhub',
    views: '889K',
    likes: '54K',
    color: '#00d4ff'
  },
  {
    id: 'r3',
    title: 'Creator daily routine',
    creator: '@creatorlife',
    views: '2.7M',
    likes: '210K',
    color: '#7c3aed'
  }
];

export const notifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Mira liked your post',
    description: 'Your latest post is getting good engagement.',
    time: '2m',
    type: 'like'
  },
  {
    id: 'n2',
    title: 'Dev started following you',
    description: 'You have a new follower.',
    time: '18m',
    type: 'follow'
  },
  {
    id: 'n3',
    title: 'Sara commented on your reel',
    description: '“This design looks premium 🔥”',
    time: '1h',
    type: 'comment'
  },
  {
    id: 'n4',
    title: 'Profile growth alert',
    description: 'Your profile reached 1K views today.',
    time: 'Today',
    type: 'system'
  }
];

export const chats: Chat[] = [
  {
    id: 'c1',
    name: 'Mira',
    message: 'Design looks powerful 🔥',
    time: '2m',
    unread: 2,
    online: true
  },
  {
    id: 'c2',
    name: 'Dev',
    message: 'Send me the reel preview.',
    time: '18m',
    unread: 0,
    online: true
  },
  {
    id: 'c3',
    name: 'Sara',
    message: 'New post idea ready?',
    time: '1h',
    unread: 1,
    online: false
  }
];
