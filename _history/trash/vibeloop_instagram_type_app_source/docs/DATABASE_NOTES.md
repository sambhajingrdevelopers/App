# Database Notes

Core tables:

- users
- profiles
- follows
- posts
- post_media
- post_likes
- post_comments
- saved_posts
- reels
- stories
- story_views
- chats
- chat_members
- messages
- notifications
- reports
- admin_logs
- verification_requests
- ads

Recommended indexes:

- users.email
- profiles.username
- posts.user_id, posts.created_at
- follows.follower_id, follows.following_id
- messages.chat_id, messages.created_at
