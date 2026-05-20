import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VibeLoop - Social Media Platform',
  description: 'A production-ready social media platform for creators, communities and businesses.'
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
