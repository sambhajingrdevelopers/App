import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

const tags = ['#travel', '#fashion', '#startup', '#fitness', '#food', '#creator', '#music', '#tech'];

export default function ExplorePage() {
  return (
    <AuthGuard>
      <SocialAppShell
        active="explore"
        title="Explore"
        subtitle="Discover trending creators, reels, hashtags and communities."
      >
        <div className="vlExploreHero">
          <h2>Discover what is trending now</h2>
          <p>Explore creators, viral reels, hashtags and fresh content.</p>
          <div className="vlExploreTags">
            {tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>

        <div className="vlExploreGrid">
          {Array.from({ length: 12 }).map((_, index) => (
            <div className="vlExploreTile" key={index}>
              <span>#{index + 1}</span>
            </div>
          ))}
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
