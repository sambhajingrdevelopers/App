# API Structure

Base URL: `/api/v1`

## Auth

- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/verify-otp`
- POST `/auth/logout`
- POST `/auth/refresh-token`

## Users

- GET `/users/me`
- PATCH `/users/me`
- GET `/users/{user_id}`
- GET `/users/{user_id}/followers`
- GET `/users/{user_id}/following`
- POST `/users/{user_id}/follow`
- DELETE `/users/{user_id}/follow`
- POST `/users/{user_id}/block`
- POST `/users/{user_id}/report`

## Posts

- GET `/posts/feed`
- POST `/posts`
- GET `/posts/{post_id}`
- PATCH `/posts/{post_id}`
- DELETE `/posts/{post_id}`
- POST `/posts/{post_id}/like`
- DELETE `/posts/{post_id}/like`
- POST `/posts/{post_id}/save`
- DELETE `/posts/{post_id}/save`
- GET `/posts/{post_id}/comments`
- POST `/posts/{post_id}/comments`

## Reels

- GET `/reels/feed`
- POST `/reels`
- GET `/reels/{reel_id}`
- POST `/reels/{reel_id}/like`
- POST `/reels/{reel_id}/comment`

## Stories

- GET `/stories/feed`
- POST `/stories`
- GET `/stories/{story_id}`
- POST `/stories/{story_id}/view`

## Chat

- GET `/chats`
- POST `/chats`
- GET `/chats/{chat_id}/messages`
- POST `/chats/{chat_id}/messages`

## Notifications

- GET `/notifications`
- PATCH `/notifications/{notification_id}/read`

## Admin

- GET `/admin/dashboard`
- GET `/admin/users`
- PATCH `/admin/users/{user_id}/status`
- GET `/admin/reports`
- PATCH `/admin/reports/{report_id}`
- POST `/admin/broadcast`
