import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VibeLoop - Premium Social Media Platform',
  description: 'Instagram and TikTok type premium social media website with reels, stories, feed, chat, creator tools and admin-ready backend.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
