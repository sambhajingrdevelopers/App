'use client';

import { useEffect, useRef, useState } from 'react';
import AdminNavLink from './AdminNavLink';

type Comment = {
  id: number;
  text: string;
  user: string;
};

type Post = {
  id: number | string;
  user: string;
  name: string;
  location: string;
  title: string;
  caption: string;
  likes: string;
  comments: string;
  color: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  liked?: boolean;
  saved?: boolean;
  commentList?: Comment[];
  isOwn?: boolean;
};

export default function SocialHomeApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | ''>('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('loading');
  const [topSearch, setTopSearch] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<number | string | null>(null);
  const [commentText, setCommentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState({
    displayName: 'You',
    username: '@you',
    bio: 'Digital creator'
  });

  function saveOwnPosts(nextPosts: Post[]) {
    const ownPosts = nextPosts.filter((post) => post.isOwn);
    localStorage.setItem('vibeloop_posts', JSON.stringify(ownPosts));
  }

  async function loadFeed() {
    setLoading(true);

    try {
      const response = await fetch('/api/feed', { cache: 'no-store' });
      const data = await response.json();

      const savedPosts = JSON.parse(localStorage.getItem('vibeloop_posts') || '[]');

      const platformPosts = (data.posts || []).map((post: Post) => ({
        ...post,
        liked: false,
        saved: false,
        commentList: []
      }));

      setStories(data.stories || []);
      setPosts([...(savedPosts || []), ...platformPosts]);
      setSource(data.source || 'fallback');
    } catch {
      const savedPosts = JSON.parse(localStorage.getItem('vibeloop_posts') || '[]');
      setPosts(savedPosts || []);
      setSource('fallback');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();

    try {
      const savedProfile = localStorage.getItem('vibeloop_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch {
      // keep default profile
    }
  }, []);

  async function handleMediaSelect(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please select an image or video file.');
      return;
    }

    setUploading(true);
    setUploadStatus('Uploading media to server...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.message || 'Server upload failed');
      }

      setMediaUrl(result.mediaUrl);
      setMediaType(result.mediaType || (isVideo ? 'video' : 'image'));
      setUploadStatus('Media uploaded to secure cloud server.');
    } catch {
      const reader = new FileReader();

      reader.onload = () => {
        setMediaUrl(String(reader.result));
        setMediaType(isVideo ? 'video' : 'image');
        setUploadStatus('Server upload failed. Local preview enabled.');
      };

      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }

  async function createPost() {
    if (!caption.trim() && !mediaUrl) return;

    const newPost: Post = {
      id: Date.now(),
      user: profile.username || '@you',
      name: profile.displayName || 'You',
      location: 'VibeLoop',
      title: mediaType === 'video' ? 'New Creator Reel' : 'New Creator Post',
      caption: caption || 'Shared a new media post.',
      likes: '0',
      comments: '0',
      color: 'pink',
      mediaUrl,
      mediaType: mediaType || undefined,
      liked: false,
      saved: false,
      commentList: [],
      isOwn: true
    };

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });

      const result = await response.json();

      const finalPost = result?.platformReady && result?.post
        ? { ...newPost, ...result.post, isOwn: true }
        : newPost;

      const updatedPosts = [finalPost, ...posts];
      setPosts(updatedPosts);
      saveOwnPosts(updatedPosts);
    } catch {
      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      saveOwnPosts(updatedPosts);
    }

    setCaption('');
    setMediaUrl('');
    setMediaType('');
    setUploadStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePreview() {
    setMediaUrl('');
    setMediaType('');
    setUploadStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function toggleLike(postId: number | string) {
    let nextLiked = false;

    const updatedPosts = posts.map((post) => {
      if (post.id !== postId) return post;

      const currentLikes = Number(String(post.likes).replace(/[^0-9]/g, '')) || 0;
      nextLiked = !post.liked;

      return {
        ...post,
        liked: nextLiked,
        likes: String(nextLiked ? currentLikes + 1 : Math.max(currentLikes - 1, 0))
      };
    });

    setPosts(updatedPosts);
    saveOwnPosts(updatedPosts);

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(String(postId))}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liked: nextLiked })
      });

      const result = await response.json();

      if (response.ok && result.success && result.post) {
        const syncedPosts = updatedPosts.map((post) =>
          post.id === postId ? { ...post, ...result.post } : post
        );

        setPosts(syncedPosts);
        saveOwnPosts(syncedPosts);
      }
    } catch {
      // UI already updated locally.
    }
  }

  async function toggleSave(postId: number | string) {
    const updatedPosts = posts.map((post) =>
      post.id === postId ? { ...post, saved: !post.saved } : post
    );

    setPosts(updatedPosts);
    saveOwnPosts(updatedPosts);
  }

  function addComment(postId: number | string) {
    if (!commentText.trim()) return;

    const updatedPosts = posts.map((post) => {
      if (post.id !== postId) return post;

      const nextComments = [
        ...(post.commentList || []),
        {
          id: Date.now(),
          user: profile.username || '@you',
          text: commentText
        }
      ];

      return {
        ...post,
        commentList: nextComments,
        comments: String(nextComments.length)
      };
    });

    setPosts(updatedPosts);
    saveOwnPosts(updatedPosts);
    setCommentText('');
  }

  async function deletePost(postId: number | string) {
    const updatedPosts = posts.filter((post) => post.id !== postId);
    setPosts(updatedPosts);
    saveOwnPosts(updatedPosts);

    try {
      await fetch('/api/posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId })
      });
    } catch {
      // Local delete already completed.
    }
  }

  async function sharePost(post: Post) {
    const text = `Check this VibeLoop post: ${post.title}`;

    try {
      await navigator.clipboard.writeText(text);
      alert('Post link copied.');
    } catch {
      alert(text);
    }
  }

  return (
    <main className="vlApp">
      <aside className="vlSidebar">
        <div className="vlBrand">
          <div>V</div>
          <span>VibeLoop</span>
        </div>

        <nav className="vlMenu">
          <a className="active" href="/home">⌂ Home</a>
          <a href="/explore">⌕ Explore</a>
          <a href="/stories">◎ Stories</a>
          <a href="/reels">▶ Reels</a>
          <a href="/messages">✉ Messages</a>
          <a href="/notifications">♡ Notifications</a>
          <a href="/saved">🔖 Saved</a>
          <a href="/profile">◉ Profile</a>
          <a href="/settings">⚙ Settings</a>
          <a href="/analytics">📊 Analytics</a>
          <a href="/safety">🛡 Safety</a>
          <a href="/verification">✓ Verification</a>
          <a href="/ads">📣 Ads</a>
          <a href="/wallet">💰 Wallet</a>
          <a href="/create">＋ Create</a>
          <AdminNavLink />
        </nav>

        <button
          className="vlLogout"
          type="button"
          onClick={() => {
            localStorage.removeItem('vibeloop_user');
            window.location.href = '/login';
          }}
        >
          Logout
        </button>
      </aside>

      <section className="vlMain">
        <header className="vlTopbar">
          <div>
            <h1>Home Feed</h1>
            <p>
              Discover creators, reels, stories and trending content.
              <span className="vlSourceBadge">
                {source === 'platform' ? ' Live Live' : ' Ready Ready'}
              </span>
            </p>
          </div>

          <div className="vlSearch">
            <span>⌕</span>
            <input
              placeholder="Search creators, reels, hashtags..."
              value={topSearch}
              onChange={(event) => setTopSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && topSearch.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(topSearch)}`;
                }
              }}
            />
          </div>
        </header>

        {loading ? (
          <div className="vlFeedLoader">
            <div />
            <h2>Loading VibeLoop feed...</h2>
            <p>Connecting to creator network.</p>
          </div>
        ) : (
          <>
            <div className="vlStories">
              {stories.map((story) => (
                <div className="vlStory" key={story}>
                  <div>{story[0]}</div>
                  <span>{story}</span>
                </div>
              ))}
            </div>

            <div className="vlComposer advanced">
              <div className="vlAvatar">{profile.displayName?.[0]?.toUpperCase() || "Y"}</div>

              <div className="vlComposerBody">
                <textarea
                  placeholder="Share something with your audience..."
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                />

                {(uploading || uploadStatus) && (
                  <p className="vlUploadStatus">{uploading ? 'Uploading...' : uploadStatus}</p>
                )}

                {mediaUrl && (
                  <div className="vlMediaPreview">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} controls />
                    ) : (
                      <img src={mediaUrl} alt="Selected media preview" />
                    )}

                    <button type="button" onClick={removePreview}>
                      Remove
                    </button>
                  </div>
                )}

                <div className="vlComposerActions">
                  <button
                    className="vlMediaBtn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    ＋ Add Photo/Video
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaSelect}
                    hidden
                  />

                  <button className="vlPostBtn" type="button" onClick={createPost}>
                    Publish Post
                  </button>
                </div>
              </div>
            </div>

            <div className="vlPostList">
              {posts.map((post) => (
                <article className="vlPostCard" key={post.id}>
                  <div className="vlPostHeader">
                    <div className={`vlAvatar ${post.color}`}>{post.name[0]}</div>
                    <div>
                      <b>{post.user} ✓</b>
                      <span>{post.location}</span>
                    </div>

                    {post.isOwn ? (
                      <button type="button" onClick={() => deletePost(post.id)}>
                        Delete
                      </button>
                    ) : (
                      <button type="button">•••</button>
                    )}
                  </div>

                  {post.mediaUrl ? (
                    <div className="vlUploadedPostMedia">
                      {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls />
                      ) : (
                        <img src={post.mediaUrl} alt={post.title} />
                      )}
                    </div>
                  ) : (
                    <div className={`vlPostMedia ${post.color}`}>
                      <h2>{post.title}</h2>
                      <p>{post.caption}</p>
                    </div>
                  )}

                  {post.mediaUrl && (
                    <div className="vlPostCaption">
                      <b>{post.user}</b> {post.caption}
                    </div>
                  )}

                  <div className="vlPostActions">
                    <button
                      type="button"
                      className={post.liked ? 'active' : ''}
                      onClick={() => toggleLike(post.id)}
                    >
                      {post.liked ? '♥' : '♡'} {post.likes}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveCommentPost(activeCommentPost === post.id ? null : post.id)
                      }
                    >
                      💬 {post.comments}
                    </button>

                    <button type="button" onClick={() => sharePost(post)}>
                      ↗ Share
                    </button>

                    <button
                      type="button"
                      className={post.saved ? 'active' : ''}
                      onClick={() => toggleSave(post.id)}
                    >
                      {post.saved ? '🔖 Saved' : '🔖 Save'}
                    </button>
                  </div>

                  {activeCommentPost === post.id && (
                    <div className="vlCommentsBox">
                      <div className="vlCommentList">
                        {(post.commentList || []).length ? (
                          (post.commentList || []).map((comment) => (
                            <p key={comment.id}>
                              <b>{comment.user}</b> {comment.text}
                            </p>
                          ))
                        ) : (
                          <p className="muted">No comments yet. Add first comment.</p>
                        )}
                      </div>

                      <div className="vlCommentInput">
                        <input
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                        />
                        <button type="button" onClick={() => addComment(post.id)}>
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <aside className="vlRightbar">
        <div className="vlProfileMini">
          <div className="vlProfileAvatar">{profile.displayName?.[0]?.toUpperCase() || "V"}</div>
          <h3>{profile.displayName || "VibeLoop Creator"}</h3>
          <p>{profile.username || "@you"}</p>

          <div className="vlMiniStats">
            <div>
              <b>{posts.length}</b>
              <span>Posts</span>
            </div>
            <div>
              <b>52.8K</b>
              <span>Followers</span>
            </div>
          </div>
        </div>

        <div className="vlPanel">
          <h3>Trending Reels</h3>
          {['Fashion Drop', 'Office Story', 'Creator Life'].map((item, index) => (
            <div className="vlTrend" key={item}>
              <div>▶</div>
              <span>{item}</span>
              <b>{index + 1}.{index + 2}M</b>
            </div>
          ))}
        </div>

        <div className="vlPanel">
          <h3>Suggested Creators</h3>
          {['Mira Creates', 'Travel Dev', 'Urban Snap'].map((name) => (
            <div className="vlCreator" key={name}>
              <div>{name[0]}</div>
              <span>{name}</span>
              <button type="button">Follow</button>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
