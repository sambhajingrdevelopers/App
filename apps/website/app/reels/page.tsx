import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

const reels = [
  ['Fashion Drop', '@styleloop', '1.2M'],
  ['Office Story', '@founderhub', '889K'],
  ['Creator Life', '@creatorlife', '2.7M'],
  ['Travel Cut', '@travel.dev', '734K']
];

export default function ReelsPage() {
  return (
    <AuthGuard>
      <SocialAppShell
        active="reels"
        title="Reels"
        subtitle="Short videos, creator moments and viral discovery."
      >
        <div className="vlReelsWall">
          {reels.map(([title, creator, views], index) => (
            <div className={`vlReelBig ${index % 3 === 1 ? 'blue' : index % 3 === 2 ? 'purple' : ''}`} key={title}>
              <div className="vlPlayBig">▶</div>
              <div className="vlReelText">
                <b>{creator}</b>
                <h2>{title}</h2>
                <span>{views} views</span>
              </div>
              <div className="vlReelSide">
                <span>♡</span>
                <span>💬</span>
                <span>↗</span>
              </div>
            </div>
          ))}
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
