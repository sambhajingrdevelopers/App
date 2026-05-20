const stories = ['You', 'Mira', 'Dev', 'Sara', 'Aarav', 'Zayn'];

const posts = [
  {
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

const reels = [
  { title: 'Fashion Drop', creator: '@styleloop', views: '1.2M', color: 'pink' },
  { title: 'Office Story', creator: '@founderhub', views: '889K', color: 'blue' },
  { title: 'Creator Life', creator: '@creatorlife', views: '2.7M', color: 'purple' }
];

const features = [
  ['Social Feed', 'Posts, captions, reactions, comments, saves and share-ready structure.'],
  ['Stories', 'Fast story viewing experience with profile rings and live-ready indicators.'],
  ['Reels', 'Vertical short video layout with creator actions and discovery flow.'],
  ['Explore', 'Trending hashtags, creator discovery, categories and smart search layout.'],
  ['Messages', 'Direct chat-ready structure with online status and unread indicators.'],
  ['Creator Profile', 'Posts grid, followers, bio, verification-ready and monetization-ready layout.'],
  ['Business Tools', 'Promotions, creator campaigns, sponsored posts and growth reports.'],
  ['Admin Control', 'Users, posts, reels, reports, ads and verification management-ready system.']
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <div className="brand">
            <div className="brandMark">V</div>
            <span>VibeLoop</span>
          </div>

          <div className="navLinks">
            <a href="#feed">Feed</a>
            <a href="#reels">Reels</a>
            <a href="#explore">Explore</a>
            <a href="#creators">Creators</a>
            <a href="#business">Business</a>
          </div>

          <a className="navButton" href="#contact">Start Project</a>
        </nav>

        <div className="heroGrid">
          <div className="heroText">
            <div className="badge">Production-ready social media platform</div>

            <h1>
              Create. Share. Connect. <span>Grow.</span>
            </h1>

            <p>
              VibeLoop is a premium social networking platform for creators,
              businesses and communities with feed, stories, reels, explore,
              messages, creator profiles and admin control.
            </p>

            <div className="heroButtons">
              <a className="primaryBtn" href="#feed">Open Platform</a>
              <a className="secondaryBtn" href="#features">View Features</a>
            </div>

            <div className="trustRow">
              <div>
                <strong>50K+</strong>
                <span>Creator capacity</span>
              </div>
              <div>
                <strong>1M+</strong>
                <span>Media-ready scale</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Cloud backend ready</span>
              </div>
            </div>
          </div>

          <div className="scene3d">
            <div className="floatingCard cardOne">
              <b>Creator Growth</b>
              <span>+42% engagement</span>
            </div>

            <div className="floatingCard cardTwo">
              <b>Live Reels</b>
              <span>1.2M views</span>
            </div>

            <div className="phone3d">
              <div className="phoneLight" />

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
                  <h3>Creator Post</h3>
                  <p>Premium media experience</p>
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
        </div>
      </section>

      <section id="feed" className="section">
        <div className="sectionHead">
          <span>Social Feed</span>
          <h2>Premium feed built for real user engagement</h2>
          <p>
            A clean post experience with creator identity, media area, caption,
            likes, comments, sharing and saving.
          </p>
        </div>

        <div className="feedGrid">
          {posts.map((post) => (
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

      <section id="reels" className="section reelsSection">
        <div className="sectionHead">
          <span>Reels</span>
          <h2>Vertical video experience with strong creator focus</h2>
          <p>
            Built for short videos, discovery, creator reach and high-retention
            content browsing.
          </p>
        </div>

        <div className="reelGrid">
          {reels.map((reel) => (
            <div className={`reelCard ${reel.color}`} key={reel.title}>
              <div className="playButton">▶</div>
              <div className="reelDetails">
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

      <section id="explore" className="section exploreSection">
        <div>
          <span className="badge">Explore</span>
          <h2>Discover creators, hashtags, trends and communities</h2>
          <p>
            The explore structure is ready for trending posts, creator
            suggestions, hashtags, search and category-based browsing.
          </p>

          <div className="tags">
            {['#travel', '#fashion', '#startup', '#fitness', '#food', '#creator'].map((tag) => (
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
      </section>

      <section id="creators" className="section creatorSection">
        <div className="profileCard3d">
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

        <div>
          <span className="badge">Creator Profile</span>
          <h2>Profiles designed for creators, influencers and businesses</h2>
          <p>
            Creator profile includes identity, bio, follower data, post grid,
            media library, verification-ready structure and monetization-ready
            sections.
          </p>
        </div>
      </section>

      <section id="features" className="section">
        <div className="sectionHead">
          <span>Platform Features</span>
          <h2>Complete product scope for a real social media system</h2>
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

      <section id="business" className="section businessSection">
        <div className="businessBox">
          <div>
            <span className="badge">Business Ready</span>
            <h2>Built for growth, monetization and admin control</h2>
            <p>
              Future modules can include creator wallet, paid reels, promoted
              posts, subscriptions, verification requests, ad manager, reports
              and business analytics.
            </p>
          </div>

          <div className="revenueCard">
            <span>Creator Revenue</span>
            <strong>₹48,920</strong>
            <p>Estimated monthly creator earnings</p>
            <div className="progress"><span /></div>
          </div>
        </div>
      </section>

      <section id="contact" className="section contactSection">
        <h2>Start building the real platform</h2>
        <p>
          Website first, then backend dynamic data, admin dashboard, mobile app,
          media upload, chat and real-time notifications.
        </p>

        <div className="heroButtons center">
          <a className="primaryBtn" href="https://wa.me/919637705868">WhatsApp Enquiry</a>
          <a className="secondaryBtn" href="mailto:hello@sambhajingrdevelopers.com">Email Enquiry</a>
        </div>
      </section>
    </main>
  );
}
