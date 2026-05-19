# VibeLoop — Instagram-Type Social Media App

A future-ready project scaffold for an Instagram-type social media platform.

This ZIP includes:

- Expo React Native mobile app
- Next.js admin/web panel
- FastAPI backend API structure
- PostgreSQL/Supabase-ready database schema
- API documentation
- Screen-flow documentation
- Empty placeholder files for future expansion

## Main Features Planned

- Login / Register / OTP
- User profiles
- Home feed
- Stories
- Reels / short videos
- Post upload
- Likes, comments, shares, saves
- Follow / unfollow
- Explore and search
- Direct messages and group chat
- Notifications
- Admin dashboard
- Report/block moderation
- Creator analytics
- Ads and monetization-ready structure

## Folder Structure

```txt
apps/mobile        Expo React Native app
apps/admin-web     Next.js admin/web panel
backend            FastAPI backend
database           SQL schema and seed files
docs               Screen flow, API, database notes
assets             Shared images/icons placeholders
scripts            Helper scripts
```

## Start Order

1. Open `docs/SCREEN_FLOW.md`
2. Review `docs/API_STRUCTURE.md`
3. Create database using `database/schema.sql`
4. Start backend from `backend/main.py`
5. Start mobile app from `apps/mobile/App.tsx`
6. Start admin panel from `apps/admin-web/app/page.tsx`

## Note

Some files are intentionally placeholders so design, coding, and business logic can be expanded step by step.
