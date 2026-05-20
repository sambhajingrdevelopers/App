const stories = ['Mira', 'Dev', 'Sara', 'Aarav', 'Zayn'];
const posts = [
  {
    user: '@mira.creates',
    title: 'Premium creator post',
    desc: 'Stories, reels, posts and chat in one creator-first platform.',
    color: 'pink'
  },
  {
    user: '@travel.dev',
    title: 'Travel reel preview',
    desc: 'Dynamic short video experience with modern discovery.',
    color: 'blue'
  },
  {
    user: '@urban.snap',
    title: 'Social growth dashboard',
    desc: 'Creator stats, engagement, saves, shares and followers.',
    color: 'purple'
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <div className="brand">
            <div className="brandIcon">V</div>
            <span>VibeLoop</span>
          </div>

          <div className="navLinks">
            <a href="#features">Features</a>
            <a href="#preview">Preview</a>
            <a href="#creators">Creators</a>
            <a href="#contact">Contact</a>
          </div>

          <a className="navButton" href="#preview">Open Preview</a>
        </nav>

        <div className="heroGrid">
          <div className="heroContent">
            <div className="badge">Premium Instagram + TikTok type platform</div>

            <h1>
              Build your own <span>social media</span> world.
            </h1>

            <p>
              VibeLoop is a premium social media website concept with home feed,
              stories, reels, explore, chat, creator profile, monetization-ready
              structure and backend integration.
            </p>

            <div className="heroActions">
              <a className="primaryBtn" href="#preview">View Website</a>
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
            <div className="phoneTop">
              <span>VibeLoop</span>
              <div>
                <b>♡</b>
                <b>✉</b>
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

            <div className="mockPost">
              <div className="mockPostTop">
                <div className="avatar">M</div>
                <div>
                  <b>@mira.creates</b>
                  <span>Mumbai, India</span>
                </div>
              </div>

              <div className="mockMedia">
                <h3>Premium Post</h3>
                <p>Dynamic creator experience</p>
              </div>

              <div className="mockActions">
                <span>♡ 12.8K</span>
                <span>💬 342</span>
                <span>↗ 91</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="sectionHead">
          <span>Complete Feature Scope</span>
          <h2>Everything needed for a real social media product</h2>
        </div>

        <div className="featureGrid">
          {[
            ['Home Feed', 'Dynamic post cards, likes, comments, saves and shares.'],
            ['Stories', 'Horizontal story system with live badges and profile rings.'],
            ['Reels', 'Short video discovery page with creator actions.'],
            ['Explore', 'Search, hashtags, trending creators and category filters.'],
            ['Chat', 'One-to-one messages, unread count and online status.'],
            ['Creator Profile', 'Followers, posts, bio, grid and creator dashboard.'],
            ['Admin Ready', 'User, post, reel, report and verification management.'],
            ['Backend Ready', 'EC2 API URL integration structure for future live data.']
          ].map(([title, text]) => (
            <div className="featureCard" key={title}>
              <div className="featureIcon">✦</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="preview" className="section previewSection">
        <div className="sectionHead">
          <span>Website Preview</span>
          <h2>Responsive social media feed layout</h2>
        </div>

        <div className="feedGrid">
          {posts.map((post) => (
            <article className={`postCard ${post.color}`} key={post.title}>
              <div className="postHeader">
                <div className="avatar">{post.user[1]}</div>
                <div>
                  <b>{post.user}</b>
                  <span>2 min ago</span>
                </div>
              </div>

              <div className="postMedia">
                <h3>{post.title}</h3>
                <p>{post.desc}</p>
              </div>

              <div className="postFooter">
                <span>♡ 12.8K</span>
                <span>💬 342</span>
                <span>🔖 Save</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="creators" className="section creatorSection">
        <div className="creatorBox">
          <div>
            <span className="miniLabel">Creator Monetization</span>
            <h2>Ready for ads, creator earnings and premium plans.</h2>
            <p>
              This website is prepared for future features like creator wallet,
              sponsored posts, verification requests, premium subscriptions,
              paid reels and business promotions.
            </p>
          </div>

          <div className="earningsCard">
            <span>This Month</span>
            <strong>₹48,920</strong>
            <p>Estimated creator revenue</p>
            <div className="bar"><span /></div>
          </div>
        </div>
      </section>

      <section id="contact" className="section contactSection">
        <h2>Start building the full platform</h2>
        <p>
          Website first, then admin panel, then mobile app, then backend dynamic feed.
        </p>

        <div className="contactActions">
          <a className="primaryBtn" href="mailto:hello@sambhajingrdevelopers.com">Email Enquiry</a>
          <a className="secondaryBtn" href="https://wa.me/919637705868">WhatsApp</a>
        </div>
      </section>
    </main>
  );
}
