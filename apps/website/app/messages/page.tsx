'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type ChatMessage = {
  id: string;
  chatId: string;
  sender: 'me' | 'them';
  text: string;
  createdAt?: string;
};

type Chat = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  messages: ChatMessage[];
};

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [source, setSource] = useState('loading');
  const [status, setStatus] = useState('');

  async function loadChats() {
    try {
      const response = await fetch('/api/chats', { cache: 'no-store' });
      const data = await response.json();

      setChats(data.chats || []);
      setSource(data.source || 'fallback');

      if (data.chats?.[0]?.id) {
        setActiveChatId(data.chats[0].id);
      }
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadChats();
  }, []);

  const activeChat = useMemo(() => {
    return chats.find((chat) => chat.id === activeChatId) || chats[0];
  }, [chats, activeChatId]);

  async function sendMessage() {
    if (!messageText.trim() || !activeChat) return;

    const tempMessage: ChatMessage = {
      id: `LOCAL-${Date.now()}`,
      chatId: activeChat.id,
      sender: 'me',
      text: messageText
    };

    const textToSend = messageText;
    setMessageText('');

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat.id
          ? {
              ...chat,
              lastMessage: textToSend,
              unread: 0,
              messages: [...(chat.messages || []), tempMessage]
            }
          : chat
      )
    );

    try {
      const response = await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChat.id,
          text: textToSend,
          sender: 'me'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Message send failed');
      }

      setStatus('Message saved to backend.');
    } catch {
      setStatus('Backend send failed. Message added locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="messages"
        title="Messages"
        subtitle="Creator conversations and direct messages."
      >
        <div className="vlMessagesStatus">
          <span>{source === 'backend' ? 'Live Backend Chat' : 'Fallback Chat Ready'}</span>
          {status && <b>{status}</b>}
        </div>

        <div className="vlChatBox">
          <div className="vlChatList">
            {chats.map((chat) => (
              <button
                type="button"
                className={`vlChatItem ${activeChat?.id === chat.id ? 'active' : ''}`}
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="vlAvatar">{chat.avatar || chat.name[0]}</div>

                <div>
                  <b>{chat.name}</b>
                  <span>{chat.lastMessage}</span>
                </div>

                {!!chat.unread && <em>{chat.unread}</em>}
              </button>
            ))}
          </div>

          <div className="vlConversation">
            {activeChat ? (
              <>
                <div className="vlConversationHead">
                  <div className="vlAvatar">{activeChat.avatar || activeChat.name[0]}</div>
                  <div>
                    <h2>{activeChat.name}</h2>
                    <p>{activeChat.username} • Online</p>
                  </div>
                </div>

                <div className="vlChatMessages">
                  {(activeChat.messages || []).map((message) => (
                    <p
                      className={`vlBubble ${message.sender === 'me' ? 'right' : 'left'}`}
                      key={message.id}
                    >
                      {message.text}
                    </p>
                  ))}
                </div>

                <div className="vlMessageInput">
                  <input
                    placeholder="Type message..."
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') sendMessage();
                    }}
                  />
                  <button type="button" onClick={sendMessage}>Send</button>
                </div>
              </>
            ) : (
              <div className="adminEmpty">No chat selected.</div>
            )}
          </div>
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
