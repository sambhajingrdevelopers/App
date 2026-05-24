'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function MessagesPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadThreads() {
    try {
      const response = await fetch('/api/messages/threads', { cache: 'no-store' });
      const data = await response.json();

      setThreads(data.threads || []);
      setUnreadTotal(data.unreadTotal || 0);
      setSource(data.source || 'fallback');

      if (!activeThread && data.threads?.length) {
        openThread(data.threads[0]);
      }
    } catch {
      setSource('fallback');
    }
  }

  async function openThread(thread: any) {
    setActiveThread(thread);
    setMessage('');

    try {
      const response = await fetch(`/api/messages/threads/${encodeURIComponent(thread.id)}`, {
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Thread failed');
      }

      setMessages(data.messages || []);

      await fetch(`/api/messages/threads/${encodeURIComponent(thread.id)}/read`, {
        method: 'POST'
      });

      setThreads((prev) =>
        prev.map((item) => item.id === thread.id ? { ...item, unread: 0 } : item)
      );

      setUnreadTotal((count) => Math.max(count - (thread.unread || 0), 0));
    } catch {
      setMessage('Thread could not load.');
    }
  }

  useEffect(() => {
    loadThreads();
  }, []);

  async function sendMessage() {
    if (!text.trim() || !activeThread) return;

    const localText = text;
    setText('');

    const localMessage = {
      id: Date.now(),
      threadId: activeThread.id,
      sender: '@you',
      text: localText,
      isMe: true,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, localMessage]);

    try {
      const response = await fetch(`/api/messages/threads/${encodeURIComponent(activeThread.id)}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: localText, sender: '@you' })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages((prev) =>
          prev.map((item) => item.id === localMessage.id ? data.message : item)
        );

        setThreads((prev) =>
          prev.map((item) => item.id === activeThread.id ? data.thread : item)
        );

        setActiveThread(data.thread);
      }

      setMessage('Message sent.');
    } catch {
      setMessage('Message sent locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="messages"
        title="Messages"
        subtitle="Real direct messages, inbox threads and unread status."
      >
        <section className="dmHero">
          <div>
            <span>{source === 'platform' ? 'Live Live Messages' : 'Messages Ready'}</span>
            <h2>Direct message center</h2>
            <p>Chat with creators, brands and followers.</p>
          </div>

          <div className="dmUnreadBadge">{unreadTotal} unread</div>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="dmLayout">
          <aside className="dmThreads">
            <div className="dmThreadsHead">
              <h3>Inbox</h3>
              <button type="button" onClick={loadThreads}>Refresh</button>
            </div>

            {threads.map((thread) => (
              <button
                type="button"
                className={`dmThread ${activeThread?.id === thread.id ? 'active' : ''}`}
                key={thread.id}
                onClick={() => openThread(thread)}
              >
                <div>{thread.name?.[0] || 'C'}</div>
                <section>
                  <b>{thread.name}</b>
                  <span>{thread.lastMessage}</span>
                  <small>{thread.username}</small>
                </section>

                {thread.unread > 0 && <em>{thread.unread}</em>}
              </button>
            ))}

            {!threads.length && <div className="adminEmpty">No messages yet.</div>}
          </aside>

          <main className="dmChat">
            {activeThread ? (
              <>
                <div className="dmChatHead">
                  <div>{activeThread.name?.[0] || 'C'}</div>
                  <section>
                    <b>{activeThread.name}</b>
                    <span>{activeThread.username}</span>
                  </section>
                </div>

                <div className="dmMessages">
                  {messages.map((item) => (
                    <article className={`dmBubble ${item.isMe ? 'me' : 'them'}`} key={item.id}>
                      <p>{item.text}</p>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : 'Now'}</span>
                    </article>
                  ))}
                </div>

                <div className="dmComposer">
                  <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') sendMessage();
                    }}
                    placeholder="Type your message..."
                  />
                  <button type="button" onClick={sendMessage}>Send</button>
                </div>
              </>
            ) : (
              <div className="adminEmpty">Select any chat to start messaging.</div>
            )}
          </main>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
