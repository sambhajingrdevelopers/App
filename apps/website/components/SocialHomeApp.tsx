'use client';

import { useState } from 'react';

const stories = ['You', 'Mira', 'Dev', 'Sara', 'Aarav', 'Zayn', 'Riya'];

const initialPosts = [
  {
    id: 1,
    user: '@mira.creates',
    name: 'Mira',
    location: 'Mumbai',
    title: 'Creator Studio Setup',
    caption: 'A premium creator workspace built for posts, reels, stories and audience growth.',
    likes: '12.8K',
    comments: '342',
    color: 'pink'
  },
  {
    id: 2,
    user: '@travel.dev',
    name: 'Dev',
    location: 'Pune Hills',
    title: 'Travel Reel Moment',
    caption: 'Discover short-form creator content with a clean and immersive reels experience.',
    likes: '8.4K',
    comments: '119',
    color: 'blue'
  },
  {
    id: 3,
    user: '@urban.snap',
    name: 'Sara',
    location: 'Bengaluru',
    title: 'Urban Creator Drop',
    caption: 'A premium post interface designed for creator engagement and brand discovery.',
    likes: '21.1K',
    comments: '901',
    color: 'purple'
  }
];

export default function SocialHomeApp() {
  const [posts, setPosts] = useState(initialPosts);
  const [caption, setCaption] = useState('');

  function createPost() {
    if (!caption.trim()) return;

    setPosts([
      {
        id: Date.now(),
        user: '@you',
        name: 'You',
        location: 'VibeLoop',
        title: 'New Creator Post',
        caption,
        likes: '0',
        comments: '0',
        color: 'pink'
      },
      ...posts
    ]);

    setCaption('');
  }

  return (
    <main className="vlApp">
      <aside className="vlSidebar">
        <div className="vlBrand">
          <div>V</div>
          <span>VibeLoop</span>
        </div>

        <nav className="vlMenu">
          <a className="active">⌂ Home</a>
          <a>⌕ Explore</a>
          <a>▶ Reels</a>
          <a>✉ Messages</a>
          <a>♡ Notifications</a>
          <a>◉ Profile</a>
          <a>⚙ Settings</a>
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
            <p>Discover creators, reels, stories and trending content.</p>
          </div>

          <div className="vlSearch">
            <span>⌕</span>
            <input placeholder="Search creators, reels, hashtags..." />
          </div>
        </header>

        <div className="vlStories">
          {stories.map((story) => (
            <div className="vlStory" key={story}>
              <div>{story[0]}</div>
              <span>{story}</span>
            </div>
          ))}
        </div>

        <div className="vlComposer">
          <div className="vlAvatar">Y</div>
          <textarea
            placeholder="Share something with your audience..."
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
          <button type="button" onClick={createPost}>Post</button>
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
                <button type="button">•••</button>
              </div>

              <div className={`vlPostMedia ${post.color}`}>
                <h2>{post.title}</h2>
                <p>{post.caption}</p>
              </div>

              <div className="vlPostActions">
                <span>♡ {post.likes}</span>
                <span>💬 {post.comments}</span>
                <span>↗ Share</span>
                <span>🔖 Save</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="vlRightbar">
        <div className="vlProfileMini">
          <div className="vlProfileAvatar">V</div>
          <h3>VibeLoop Creator</h3>
          <p>@you</p>

          <div className="vlMiniStats">
            <div>
              <b>248</b>
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
