import { posts } from '../data/websiteData';

export default function FeedSection() {
  return (
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
  );
}
