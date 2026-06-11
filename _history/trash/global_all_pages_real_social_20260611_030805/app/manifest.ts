import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VibeLoop Social',
    short_name: 'VibeLoop',
    description: 'A modern social media platform for posts, reels, stories, messages and creators.',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#07070D',
    theme_color: '#ff2d95',
    orientation: 'portrait-primary',
    categories: ['social', 'entertainment', 'photo', 'video'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/maskable-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Create Post',
        short_name: 'Create',
        description: 'Create a new post, reel or story',
        url: '/create',
        icons: [{ src: '/icons/icon.svg', sizes: '512x512' }]
      },
      {
        name: 'Messages',
        short_name: 'Messages',
        description: 'Open direct messages',
        url: '/messages',
        icons: [{ src: '/icons/icon.svg', sizes: '512x512' }]
      },
      {
        name: 'Profile',
        short_name: 'Profile',
        description: 'Open creator profile',
        url: '/profile',
        icons: [{ src: '/icons/icon.svg', sizes: '512x512' }]
      }
    ]
  };
}
