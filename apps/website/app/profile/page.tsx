import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <SocialAppShell
        active="profile"
        title="Profile"
        subtitle="Manage your creator identity and social presence."
      >
        <div className="vlProfilePage">
          <div className="vlProfileBanner" />
          <div className="vlProfileInfo">
            <div className="vlProfileAvatar big">V</div>
            <div>
              <h2>VibeLoop Creator</h2>
              <p>@you • Digital creator • Reels • Stories • Brand collaborations</p>
            </div>
            <button>Edit Profile</button>
          </div>

          <div className="vlProfileStatsRow">
            <div><b>248</b><span>Posts</span></div>
            <div><b>52.8K</b><span>Followers</span></div>
            <div><b>320</b><span>Following</span></div>
            <div><b>1.2M</b><span>Views</span></div>
          </div>

          <div className="vlProfileMediaGrid">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} />
            ))}
          </div>
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
