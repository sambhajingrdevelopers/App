import { stories } from '../data/websiteData';

export default function HeroSection() {
  return (
    <section className="hero">
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
              <span>Cloud platform ready</span>
            </div>
          </div>
        </div>

        <div className="scene3d">
          <div className="graphicOrb orbOne" />
          <div className="graphicOrb orbTwo" />
          <div className="graphicRing ringOne" />
          <div className="graphicRing ringTwo" />

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
                  <b>@you ✓</b>
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
  );
}
