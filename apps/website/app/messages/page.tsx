import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

const chats = [
  ['Mira', 'Design looks powerful 🔥', '2m', '2'],
  ['Dev', 'Send me the reel preview.', '18m', ''],
  ['Sara', 'New post idea ready?', '1h', '1'],
  ['Aarav', 'Let us build this platform.', '3h', '']
];

export default function MessagesPage() {
  return (
    <AuthGuard>
      <SocialAppShell
        active="messages"
        title="Messages"
        subtitle="Creator conversations and direct messages."
      >
        <div className="vlChatBox">
          <div className="vlChatList">
            {chats.map(([name, msg, time, unread]) => (
              <div className="vlChatItem" key={name}>
                <div className="vlAvatar">{name[0]}</div>
                <div>
                  <b>{name}</b>
                  <span>{msg}</span>
                </div>
                <small>{time}</small>
                {unread && <em>{unread}</em>}
              </div>
            ))}
          </div>

          <div className="vlConversation">
            <h2>Mira</h2>
            <p className="vlBubble left">Design looks powerful 🔥</p>
            <p className="vlBubble right">Yes, now we are making it real.</p>
            <p className="vlBubble left">Add reels and creator dashboard next.</p>
            <div className="vlMessageInput">
              <input placeholder="Type message..." />
              <button>Send</button>
            </div>
          </div>
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
