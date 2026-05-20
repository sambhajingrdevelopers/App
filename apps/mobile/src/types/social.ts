export type Story = {
  id: string;
  name: string;
  username?: string;
  avatarColor: string;
  isLive?: boolean;
  hasNewStory?: boolean;
};

export type Post = {
  id: string;
  user: string;
  name: string;
  location: string;
  caption: string;
  likes: string;
  comments: string;
  shares?: string;
  saves?: string;
  color: string;
  verified?: boolean;
  createdAt?: string;
};

export type Reel = {
  id: string;
  title: string;
  creator: string;
  views: string;
  likes?: string;
  color: string;
};

export type Chat = {
  id: string;
  name: string;
  message: string;
  time: string;
  unread?: number;
  online?: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'like' | 'follow' | 'comment' | 'system';
};
