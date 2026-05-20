export default function HomePage() {
  return (
    <main className="home">
      <section className="hero">
        <nav className="nav">
          <div className="brand">
            <div className="brandIcon">V</div>
            <span>VibeLoop</span>
          </div>

          <div className="navLinks">
            <a href="#features">Features</a>
            <a href="#preview">Preview</a>
            <a href="#contact">Contact</a>
          </div>

          <a className="navButton" href="#preview">Open Preview</a>
        </nav>

        <div className="heroGrid">
          <div className="heroContent">
            <div className="badge">Premium social media website</div>

            <h1>
              Build your own <span>creator world</span>.
            </h1>

            <p>
              VibeLoop is a premium Instagram and TikTok type website with feed,
              stories, reels preview, creator profile, chat-ready structure and
              backend API integration.
            </p>

            <div className="heroActions">
              <a className="primaryBtn" href="#preview">View Preview</a>
              <a className="secondaryBtn" href="#features">See Features</a>
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
              {['Mira', 'Dev', 'Sara', 'Aarav', 'Zayn'].map((story) => (
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
          <span>Feature Scope</span>
          <h2>Everything needed for a modern social media product</h2>
        </div>

        <div className="featureGrid">
          {[
            ['Home Feed', 'Dynamic post cards, likes, comments, saves and shares.'],
            ['Stories', 'Horizontal story system with live badges and profile rings.'],
            ['Reels', 'Short video discovery page with creator actions.'],
            ['Explore', 'Search, hashtags, trending creators and category filters.'],
            ['Chat Ready', 'One-to-one messages and unread count structure.'],
            ['Creator Profile', 'Followers, posts, bio, grid and creator dashboard.']
          ].map(([title, text]) => (
            <div className="featureCard" key={title}>
              <div className="featureIcon">✦</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
