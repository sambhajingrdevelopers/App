import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

const notifications = [
  {
    type: 'like',
    icon: '♡',
    title: 'Mira liked your post',
    desc: 'Your creator post is getting strong engagement.',
    time: '2 min ago'
  },
  {
    type: 'comment',
    icon: '💬',
    title: 'Dev commented on your reel',
    desc: '“This reel style looks premium and powerful.”',
    time: '18 min ago'
  },
  {
    type: 'follow',
    icon: '＋',
    title: 'Sara started following you',
    desc: 'You have a new creator follower.',
    time: '1 hour ago'
  },
  {
    type: 'save',
    icon: '🔖',
    title: 'Your post was saved 24 times',
    desc: 'Saved posts help your profile reach more people.',
    time: 'Today'
  },
  {
    type: 'system',
    icon: '⚡',
    title: 'Creator growth alert',
    desc: 'Your profile reach increased by 42% this week.',
    time: 'Today'
  }
];

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <SocialAppShell
        active="notifications"
        title="Notifications"
        subtitle="Track likes, comments, follows, saves and creator growth alerts."
      >
        <div className="vlNotificationStats">
          <div>
            <b>128</b>
            <span>Today</span>
          </div>
          <div>
            <b>42%</b>
            <span>Growth</span>
          </div>
          <div>
            <b>18K</b>
            <span>Reach</span>
          </div>
        </div>

        <div className="vlNotificationList">
          {notifications.map((item) => (
            <article className={`vlNotificationCard ${item.type}`} key={item.title}>
              <div className="vlNotificationIcon">{item.icon}</div>

              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <span>{item.time}</span>
              </div>

              <button type="button">View</button>
            </article>
          ))}
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
