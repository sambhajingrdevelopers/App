import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VibeLoop - Premium Social Media Platform',
  description: 'Premium Instagram and TikTok type social media website.'
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
