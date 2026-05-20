const stories = ['You', 'Mira', 'Dev', 'Sara', 'Aarav', 'Zayn'];

const feedPosts = [
  {
    user: '@mira.creates',
    name: 'Mira',
    location: 'Mumbai, India',
    title: 'Creator Studio Setup',
    caption: 'Building a premium social world with posts, reels, stories and creator growth.',
    likes: '12.8K',
    comments: '342',
    color: 'pink'
  },
  {
    user: '@travel.dev',
    name: 'Dev',
    location: 'Pune Hills',
    title: 'Travel Reel Moment',
    caption: 'Short video discovery with trending creator content and modern explore layout.',
    likes: '8.4K',
    comments: '119',
    color: 'blue'
  },
  {
    user: '@urban.snap',
    name: 'Sara',
    location: 'Bengaluru',
    title: 'Urban Creator Drop',
    caption: 'A clean, premium post card experience with engagement-first UI.',
    likes: '21.1K',
    comments: '901',
    color: 'purple'
  }
];

const reels = [
  { title: 'Fashion Reel', creator: '@styleloop', views: '1.2M', color: 'pink' },
  { title: 'Office Vlog', creator: '@founderhub', views: '889K', color: 'blue' },
  { title: 'Daily Creator', creator: '@creatorlife', views: '2.7M', color: 'purple' }
];

const features = [
  ['Stories', 'Share quick moments with story rings and live indicators.'],
  ['Feed Posts', 'Photo/video post cards with like, comment, share and save.'],
  ['Reels', 'Short video section with vertical reel-style discovery.'],
  ['Explore', 'Trending hashtags, creators, categories and search-ready layout.'],
  ['Messages', 'Chat-ready structure with online status and unread counters.'],
  ['Profile', 'Creator profile with followers, bio, posts and media grid.'],
  ['Notifications', 'Likes, comments, follows and system alerts.'],
  ['Admin Ready', 'Future admin control for users, posts, reels, reports and ads.']
];

const hashtags = ['#travel', '#fashion', '#startup', '#fitness', '#food', '#creator'];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <div className="brand">
            <div className="brandLogo">V</div>
            <span>VibeLoop</span>
          </div>

          <div className="navLinks">
            <a href="#feed">Feed</a>
            <a href="#reels">Reels</a>
            <a href="#explore">Explore</a>
            <a href="#profile">Profile</a>
            <a href="#contact">Contact</a>
          </div>

          <a className="navCta" href="#contact">Get Started</a>
        </nav>

        <div className="heroGrid">
          <div className="heroText">
            <div className="badge">Premium social media platform</div>

            <h1>
              Create. Share. Connect. <span>Grow.</span>
            </h1>

            <p>
              VibeLoop is a premium Instagram and TikTok type social media platform
              with posts, stories, reels, explore, chat, creator profiles and
              admin-ready backend structure.
            </p>

            <div className="heroButtons">
              <a className="primaryBtn" href="#feed">View Demo</a>
              <a className="secondaryBtn" href="#features">See Features</a>
            </div>

            <div className="stats">
              <div>
                <strong>50K+</strong>
                <span>Creators</span>
              </div>
              <div>
                <strong>1.2M</strong>
                <span>Reel Views</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Live Feed</span>
              </div>
            </div>
          </div>

          <div className="phoneMock">
            <div className="phoneHeader">
              <b>VibeLoop</b>
              <div>
                <span>♡</span>
                <span>✉</span>
              </div>
            </div>

            <div className="storyRow">
              {stories.map((story) => (
                <div className="story" key={story}>
                  <div>{story[0]}</div>
                  <span>{story}</span>
                </div>
              ))}
            </div>

            <div className="mobilePost">
              <div className="postUser">
                <div className="avatar">M</div>
                <div>
                  <b>@mira.creates ✓</b>
                  <span>Mumbai, India</span>
                </div>
              </div>

              <div className="mobileMedia">
                <h3>Premium Post</h3>
                <p>Creator content preview</p>
              </div>

              <div className="mobileActions">
                <span>♡ 12.8K</span>
                <span>💬 342</span>
                <span>↗ 91</span>
                <span>🔖</span>
              </div>
            </div>

            <div className="bottomNav">
              <span>⌂</span>
              <span>⌕</span>
              <span>＋</span>
              <span>▶</span>
              <span>◉</span>
            </div>
          </div>
        </div>
      </section>

      <section id="feed" className="section">
        <div className="sectionHead">
          <span>Live Feed Preview</span>
          <h2>Real social feed design with premium post cards</h2>
          <p>Users can discover posts, like, comment, share, save and follow creators.</p>
        </div>

        <div className="feedGrid">
          {feedPosts.map((post) => (
            <article className="feedCard" key={post.user}>
              <div className="postUser">
                <div className={`avatar ${post.color}`}>{post.name[0]}</div>
                <div>
                  <b>{post.user}</b>
                  <span>{post.location}</span>
                </div>
              </div>

              <div className={`postMedia ${post.color}`}>
                <h3>{post.title}</h3>
                <p>{post.caption}</p>
              </div>

              <div className="postActions">
                <span>♡ {post.likes}</span>
                <span>💬 {post.comments}</span>
                <span>↗ Share</span>
                <span>🔖 Save</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="reels" className="section darkSection">
        <div className="sectionHead">
          <span>Reels Experience</span>
          <h2>Short video discovery for modern creators</h2>
          <p>Vertical reel cards with views, likes, creator name and play action.</p>
        </div>

        <div className="reelGrid">
          {reels.map((reel) => (
            <div className={`reelCard ${reel.color}`} key={reel.title}>
              <div className="playBtn">▶</div>
              <div className="reelInfo">
                <b>{reel.creator}</b>
                <h3>{reel.title}</h3>
                <span>{reel.views} views</span>
              </div>
              <div className="reelActions">
                <span>♡</span>
                <span>💬</span>
                <span>↗</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="explore" className="section">
        <div className="sectionHead">
          <span>Explore Page</span>
          <h2>Trending hashtags, creators and discovery categories</h2>
        </div>

        <div className="exploreGrid">
          <div className="searchPreview">
            <h3>Search creators, reels and hashtags</h3>
            <div className="fakeSearch">Search VibeLoop...</div>

            <div className="hashtagList">
              {hashtags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="creatorList">
            {['Mira Creates', 'Travel Dev', 'Urban Snap', 'Style Loop'].map((name, index) => (
              <div className="creatorItem" key={name}>
                <div className="avatar">{name[0]}</div>
                <div>
                  <b>{name}</b>
                  <span>{index + 2}.{index}K followers</span>
                </div>
                <button>Follow</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="profile" className="section profileSection">
        <div className="profileMock">
          <div className="profileTop">
            <div className="profileAvatar">V</div>
            <div className="profileStats">
              <div>
                <b>248</b>
                <span>Posts</span>
              </div>
              <div>
                <b>52.8K</b>
                <span>Followers</span>
              </div>
              <div>
                <b>320</b>
                <span>Following</span>
              </div>
            </div>
          </div>

          <h3>VibeLoop Creator</h3>
          <p>Digital creator • Reels • Stories • Brand collaborations</p>

          <div className="profileButtons">
            <button>Edit Profile</button>
            <button>Share Profile</button>
          </div>

          <div className="profileGrid">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} />
            ))}
          </div>
        </div>

        <div className="profileText">
          <span className="badge">Creator Profile</span>
          <h2>Premium profile page ready for creators and influencers</h2>
          <p>
            Profile includes followers, following, bio, posts grid, creator analytics,
            verification-ready flow and monetization support.
          </p>
        </div>
      </section>

      <section id="features" className="section">
        <div className="sectionHead">
          <span>Full App Scope</span>
          <h2>Everything needed for a real social media product</h2>
        </div>

        <div className="featureGrid">
          {features.map(([title, text]) => (
            <div className="featureCard" key={title}>
              <div>✦</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="section ctaSection">
        <h2>Build your own social media platform</h2>
        <p>Website first, then mobile app, admin panel and backend dynamic feed.</p>

        <div className="heroButtons center">
          <a className="primaryBtn" href="https://wa.me/919637705868">WhatsApp Enquiry</a>
          <a className="secondaryBtn" href="mailto:hello@sambhajingrdevelopers.com">Email Enquiry</a>
        </div>
      </section>
    </main>
  );
}
