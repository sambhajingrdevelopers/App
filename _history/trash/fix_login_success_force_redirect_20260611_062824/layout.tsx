import AuthGate from "./AuthGate"

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import './globals.css';
import type { Metadata } from 'next';

import MobileBottomNav from '../components/MobileBottomNav';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import PWARegister from '../components/PWARegister';
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
      <body><AuthGate>{children}</AuthGate>        <MobileBottomNav />
              <PWARegister />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}