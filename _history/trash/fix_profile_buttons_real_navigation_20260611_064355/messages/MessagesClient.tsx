'use client'
// @ts-nocheck

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Conversation = {
  username: string
  name: string
  avatarUrl?: string
  lastMessage?: string
  lastAt?: string
  unread?: number
  online?: boolean
  lastSeen?: string
  pinned?: boolean
  muted?: boolean
  verified?: boolean
}

type Message = {
  id: string
  sender: string
  receiver: string
  text: string
  createdAt: string
}

function cleanUsername(value?: string | null) {
  const text = String(value || '').trim()
  if (!text) return '@guest'
  return text.startsWith('@') ? text : `@${text}`
}

function getCurrentUser() {
  if (typeof window === 'undefined') return '@pradip'

  const saved =
    window.localStorage.getItem('vibeloop_user') ||
    window.localStorage.getItem('sessionUser') ||
    window.localStorage.getItem('username') ||
    window.localStorage.getItem('currentUser') ||
    '@pradip'

  try {
    const parsed = JSON.parse(saved)
    return cleanUsername(parsed.username || parsed.user || parsed.handle || parsed.name || '@pradip')
  } catch {
    return cleanUsername(saved)
  }
}

function firstLetter(value: string) {
  return String(value || 'U').replace('@', '').slice(0, 1).toUpperCase()
}

function timeLabel(value?: string) {
  if (!value) return ''
  const t = new Date(value).getTime()
  if (Number.isNaN(t)) return ''
  const min = Math.max(1, Math.floor((Date.now() - t) / 60000))
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

function normalizeConversation(row: any, me: string): Conversation | null {
  const possible =
    row.withUser ||
    row.with_user ||
    row.otherUser ||
    row.other_user ||
    row.username ||
    row.user ||
    row.receiver ||
    row.to_user ||
    row.sender ||
    row.from_user

  const username = cleanUsername(possible)

  if (!username || username === '@guest' || username.toLowerCase() === me.toLowerCase()) {
    return null
  }

  return {
    username,
    name: row.name || row.displayName || row.display_name || username.replace('@', ''),
    avatarUrl: row.avatarUrl || row.avatar_url || '',
    lastMessage: row.lastMessage || row.last_message || row.text || row.message || '',
    lastAt: row.lastAt || row.last_at || row.createdAt || row.created_at || '',
    unread: Number(row.unread || row.unreadCount || row.unread_count || 0),
    online: Boolean(row.online ?? false),
    pinned: Boolean(row.pinned),
    muted: Boolean(row.muted),
    verified: row.verified !== false,
    lastSeen: row.lastSeen || row.last_seen || '',
  }
}

function normalizeMessage(row: any): Message {
  return {
    id: String(row.id || row.messageId || row.message_id || `${Date.now()}-${Math.random()}`),
    sender: cleanUsername(row.sender || row.from_user || row.from || row.user),
    receiver: cleanUsername(row.receiver || row.to_user || row.to || row.withUser),
    text: String(row.text || row.message || row.body || ''),
    createdAt: row.createdAt || row.created_at || row.time || new Date().toISOString(),
  }
}

export default function MessagesClient() {
  const params = useSearchParams()

  const [me, setMe] = useState('@guest')
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [notice, setNotice] = useState('')
  const [backendError, setBackendError] = useState('')

  const chatOpen = Boolean(selected)

  async function loadConversations(currentUser: string) {
    setLoadingList(true)
    setBackendError('')

    const data = await fetch(`/api/secure-messages/conversations?user=${encodeURIComponent(currentUser)}`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .catch((error) => ({
        success: false,
        message: error?.message || 'Backend connection failed.',
        conversations: [],
      }))

    if (!data.success) {
      setBackendError(data.message || 'Backend connection failed.')
      setConversations([])
      setLoadingList(false)
      return []
    }

    const raw =
      Array.isArray(data.conversations) ? data.conversations :
      Array.isArray(data.items) ? data.items :
      Array.isArray(data.users) ? data.users :
      Array.isArray(data.data) ? data.data :
      []

    const normalized = raw
      .map((item: any) => normalizeConversation(item, currentUser))
      .filter(Boolean) as Conversation[]

    const withPresence = await applyPresence(normalized)
    setConversations(withPresence)
    setLoadingList(false)
    return withPresence
  }

  async function loadThread(currentUser: string, otherUser: string) {
    setLoadingThread(true)

    const data = await fetch(
      `/api/secure-messages/thread?user=${encodeURIComponent(currentUser)}&with_user=${encodeURIComponent(otherUser)}&withUser=${encodeURIComponent(otherUser)}`,
      { cache: 'no-store' }
    )
      .then((res) => res.json())
      .catch((error) => ({
        success: false,
        message: error?.message || 'Thread backend failed.',
        messages: [],
      }))

    if (!data.success) {
      setNotice(data.message || 'Thread backend failed.')
      setMessages([])
      setLoadingThread(false)
      return
    }

    const raw =
      Array.isArray(data.messages) ? data.messages :
      Array.isArray(data.items) ? data.items :
      Array.isArray(data.data) ? data.data :
      []

    setMessages(raw.map(normalizeMessage))
    setLoadingThread(false)
  }

  
  async function sendHeartbeat(currentUser: string) {
    await fetch('/api/presence/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, device: 'web', page: 'messages' }),
    }).catch(() => null)
  }

  async function applyPresence(list: Conversation[]) {
    const users = list.map((item) => item.username).join(',')
    if (!users) return list

    const data = await fetch(`/api/presence/list?users=${encodeURIComponent(users)}`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .catch(() => ({ success: false, presence: [] }))

    const presenceMap = new Map<string, any>()

    if (Array.isArray(data.presence)) {
      data.presence.forEach((item: any) => {
        presenceMap.set(cleanUsername(item.username).toLowerCase(), item)
      })
    }

    return list.map((item) => {
      const found = presenceMap.get(item.username.toLowerCase())
      return {
        ...item,
        online: Boolean(found?.online),
        lastSeen: found?.lastSeen || item.lastSeen || '',
      }
    })
  }

async function boot() {
    const currentUser = getCurrentUser()
    setMe(currentUser)
    await sendHeartbeat(currentUser)

    const list = await loadConversations(currentUser)
    const to = cleanUsername(params?.get('to') || params?.get('user') || '')

    if (to && to !== '@guest') {
      const existing = list.find((c) => c.username.toLowerCase() === to.toLowerCase())
      const next = existing || {
        username: to,
        name: to.replace('@', ''),
        lastMessage: '',
        unread: 0,
        online: true,
        verified: false,
      }

      setSelected(next)
      await loadThread(currentUser, next.username)
    } else {
      setSelected(null)
      setMessages([])
    }
  }

  useEffect(() => {
    boot()
  }, [params])

  async function openChat(item: Conversation) {
    setSelected(item)
    await loadThread(me, item.username)
  }

  async function sendMessage() {
    const finalText = text.trim()
    if (!selected || !finalText) return

    setText('')
    setNotice('')

    const data = await fetch('/api/secure-messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: me,
        receiver: selected.username,
        text: finalText,
      }),
    })
      .then((res) => res.json())
      .catch((error) => ({
        success: false,
        message: error?.message || 'Send failed.',
      }))

    if (!data.success) {
      setNotice(data.message || 'Message not sent. Backend not connected.')
      setText(finalText)
      return
    }

    await loadThread(me, selected.username)
    await loadConversations(me)
  }


  useEffect(() => {
    const currentUser = getCurrentUser()
    sendHeartbeat(currentUser)

    const timer = window.setInterval(() => {
      sendHeartbeat(currentUser)
    }, 25000)

    const offline = () => {
      navigator.sendBeacon?.('/api/presence/offline', new Blob([JSON.stringify({ user: currentUser })], { type: 'application/json' }))
    }

    window.addEventListener('beforeunload', offline)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('beforeunload', offline)
    }
  }, [])

  const hasRealConversations = conversations.length > 0

  return (
    <main className={`realMsgRoot ${chatOpen ? 'chatOpen' : ''}`}>
      <section className="realMsgList">
        <header className="realMsgListHeader">
          <h1>Chats</h1>
          <button type="button" onClick={boot}>↻</button>
        </header>

        <label className="realMsgSearch">
          <span>⌕</span>
          <input placeholder="Search or start a new chat" />
        </label>

        <div className="realMsgFilters">
          <button className="active">All</button>
          <button>Unread</button>
          <button>Favorites</button>
          <button>Groups</button>
          <button>Pinned</button>
        </div>

        <div className="realMsgArchived">
          <span>▤</span>
          <b>Archived</b>
          <small>0</small>
        </div>

        {backendError && (
          <div className="realMsgState error">
            <b>Backend not connected</b>
            <span>{backendError}</span>
          </div>
        )}

        {loadingList ? (
          <div className="realMsgState">Loading real conversations...</div>
        ) : !backendError && !hasRealConversations ? (
          <div className="realMsgState">
            <b>No real conversations</b>
            <span>Send a message from profile or connect backend data.</span>
          </div>
        ) : (
          <div className="realMsgRows">
            {conversations.map((item) => (
              <button
                key={item.username}
                type="button"
                className="realMsgRow"
                onClick={() => openChat(item)}
              >
                <span className="realMsgAvatar">
                  {item.avatarUrl ? <img src={item.avatarUrl} alt={item.name} /> : <b>{firstLetter(item.name || item.username)}</b>}
                  {item.online && <i />}
                </span>

                <span className="realMsgRowBody">
                  <strong>
                    {item.name}
                    {item.verified && <em>✓</em>}
                  </strong>
                  <small>{item.lastMessage || 'No messages yet'}</small>
                </span>

                <span className="realMsgMeta">
                  <small>{timeLabel(item.lastAt)}</small>
                  {item.unread ? <b>{item.unread}</b> : null}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="realMsgLock">🔒 Real messages only. No demo chat list.</p>
      </section>

      <section className="realMsgChat">
        {selected ? (
          <>
            <header className="realMsgChatHeader">
              <button type="button" className="realMsgBack" onClick={() => setSelected(null)}>‹</button>
              <span className="realMsgAvatar small">
                <b>{firstLetter(selected.name || selected.username)}</b>
                {selected.online && <i />}
              </span>
              <div>
                <strong>{selected.name}</strong>
                <small>{selected.username} · {selected.online ? 'online' : selected.lastSeen ? `last seen ${timeLabel(selected.lastSeen)}` : 'offline'}</small>
              </div>
              <a href={`/profile?username=${encodeURIComponent(selected.username)}`}>Profile</a>
            </header>

            <div className="realMsgThread">
              <span className="realMsgDate">Today</span>
              <div className="realMsgEncrypt">🔐 Messages are stored through backend only.</div>

              {loadingThread ? (
                <div className="realMsgEmpty">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="realMsgEmpty">
                  <b>No messages yet</b>
                  <span>Send first message to {selected.name}</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = msg.sender.toLowerCase() === me.toLowerCase()
                  return (
                    <article key={msg.id} className={`realMsgBubble ${mine ? 'mine' : 'their'}`}>
                      <span>{msg.text}</span>
                      <small>{timeLabel(msg.createdAt)} {mine ? '✓✓' : ''}</small>
                    </article>
                  )
                })
              )}
            </div>

            {notice && <div className="realMsgNotice">{notice}</div>}

            <footer className="realMsgComposer">
              <button type="button">😊</button>
              <button type="button">📎</button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage()
                }}
                placeholder="Type a message"
              />
              <button type="button">🎙</button>
              <button type="button" className="send" onClick={sendMessage}>➤</button>
            </footer>
          </>
        ) : (
          <div className="realMsgNoChat">
            <b>Select a chat</b>
            <span>Your real user-to-user conversations will open here.</span>
          </div>
        )}
      </section>
    </main>
  )
}
