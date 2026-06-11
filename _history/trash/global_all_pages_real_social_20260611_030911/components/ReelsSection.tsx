import { reels } from '../data/websiteData';

export default function ReelsSection() {
  return (
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
  );
}
