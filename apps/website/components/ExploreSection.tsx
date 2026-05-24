import { hashtags } from '../data/websiteData';

export default function ExploreSection() {
  return (
    <section id="explore" className="section exploreSection">
      <div>
        <span className="badge">Explore</span>
        <h2>Discover creators, hashtags, trends and communities</h2>
        <p>
          The explore structure is ready for trending posts, creator
          suggestions, hashtags, search and category-based browsing.
        </p>

        <div className="tags">
          {hashtags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="creatorList">
        {['VibeLoop Creator', 'Creator Studio', 'Content Hub', 'Style Loop'].map((name, index) => (
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
  );
}
