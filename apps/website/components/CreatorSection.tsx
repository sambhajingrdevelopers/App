export default function CreatorSection() {
  return (
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
  );
}
