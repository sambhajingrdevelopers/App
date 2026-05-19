import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VibeLoop Admin',
  description: 'Admin dashboard for VibeLoop social media app'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
