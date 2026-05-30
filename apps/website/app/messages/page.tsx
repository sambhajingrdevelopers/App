'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import { getSessionUser } from '../../lib/sessionUser'

type ChatUser = {
  id?: string
  name: string
  username: string
  bio?: string
  avatarUrl?: string
  verified?: boolean
  lastMessage?: string
  lastAt?: string
  unread?: number
  pinned?: boolean
  muted?: boolean
  typing?: boolean
  online?: boolean
}

type ChatMessage = {
  id: string
  sender: string
  receiver: string
  text: string
  createdAt: string
  readAt?: string | null
}

type FilterType = 'all' | 'unread' | 'favorites' | 'groups' | 'pinned'

function cleanUsername(value?: string | null) {
  const clean = String(value || '').trim()
  if (!clean) return '@creator'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'U').replace('@', '').trim().slice(0, 1).toUpperCase()
}

function validImage(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

function timeLabel(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const min = Math.max(1, Math.floor(diff / 60000))
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

function sameUser(a?: string, b?: string) {
  return cleanUsername(a).toLowerCase() === cleanUsername(b).toLowerCase()
}

export default function MessagesPage() {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const [me, setMe] = useState('@guest')
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selected, setSelected] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [text, setText] = useState('')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }

  async function loadChatUsers(currentUser: string) {
    const data = await fetch(`/api/messages/users?user=${encodeURIComponent(currentUser)}`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .catch(() => ({ success: false, users: [] }))

    const list = Array.isArray(data.users) ? data.users : []

    return list
      .map((user: any) => ({
        id: String(user.id || user.username || ''),
        name: user.name || cleanUsername(user.username).replace('@', '') || 'Creator',
        username: cleanUsername(user.username),
        bio: user.bio || 'Digital Creator',
        avatarUrl: user.avatarUrl || '',
        verified: user.verified !== false,
        lastMessage: user.lastMessage || '',
        lastAt: user.lastAt || '',
        unread: Number(user.unread || 0),
        pinned: Boolean(user.pinned),
        muted: Boolean(user.muted),
        typing: Boolean(user.typing),
        online: user.online !== false,
      }))
      .filter((user: ChatUser) => !sameUser(user.username, currentUser))
  }

  async function loadThread(currentUser: string, otherUser: string) {
    setLoadingChat(true)
    setNotice('')

    const data = await fetch(
      `/api/secure-messages/thread?user=${encodeURIComponent(currentUser)}&with=${encodeURIComponent(otherUser)}`,
      { cache: 'no-store' }
    )
      .then((res) => res.json())
      .catch(() => ({
        success: false,
        messages: [],
        message: 'Message backend connection failed.',
      }))

    setMessages(Array.isArray(data.messages) ? data.messages : [])

    if (!data.success) {
      setNotice(data.message || 'Message backend failed.')
    }

    setLoadingChat(false)
    scrollBottom()
  }

  async function openChat(user: ChatUser) {
    const fixedUser = {
      ...user,
      username: cleanUsername(user.username),
      name: user.name || cleanUsername(user.username).replace('@', ''),
    }

    setSelected(fixedUser)
    setMobileChatOpen(true)
    window.history.replaceState(null, '', `/messages?to=${encodeURIComponent(fixedUser.username)}`)

    await loadThread(me, fixedUser.username)
  }

  async function boot() {
    setLoadingUsers(true)

    const session = await getSessionUser()
    const currentUser = cleanUsername(session.username)
    setMe(currentUser)

    const list = await loadChatUsers(currentUser)
    setUsers(list)

    const params = new URLSearchParams(window.location.search)
    const toParam = params.get('to')

    if (toParam) {
      const targetUsername = cleanUsername(toParam)
      const target =
        list.find((user) => sameUser(user.username, targetUsername)) || {
          name: targetUsername.replace('@', '') || 'Creator',
          username: targetUsername,
          bio: 'Secure chat',
          online: true,
          verified: true,
        }

      setSelected(target)
      setMobileChatOpen(true)
      await loadThread(currentUser, targetUsername)
    } else if (window.matchMedia('(min-width: 900px)').matches) {
      const first = list[0] || null
      setSelected(first)
      setMobileChatOpen(false)

      if (first) {
        await loadThread(currentUser, first.username)
      }
    } else {
      setSelected(null)
      setMobileChatOpen(false)
    }

    setLoadingUsers(false)
  }

  useEffect(() => {
    boot()
  }, [])

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase()

    return users.filter((user) => {
      if (activeFilter === 'unread' && !user.unread) return false
      if (activeFilter === 'pinned' && !user.pinned) return false
      if (activeFilter === 'favorites' && !user.verified) return false
      if (activeFilter === 'groups') {
        const isGroup =
          user.name.toLowerCase().includes('group') ||
          user.name.toLowerCase().includes('team') ||
          user.username.toLowerCase().includes('group') ||
          user.username.toLowerCase().includes('team')

        if (!isGroup) return false
      }

      if (!q) return true

      return (
        user.name.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        String(user.lastMessage || '').toLowerCase().includes(q) ||
        String(user.bio || '').toLowerCase().includes(q)
      )
    })
  }, [users, search, activeFilter])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = text.trim()
    if (!value || !selected) return

    setSending(true)
    setNotice('')

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      sender: me,
      receiver: selected.username,
      text: value,
      createdAt: new Date().toISOString(),
    }

    setMessages((old) => [...old, optimistic])
    setText('')
    scrollBottom()

    const data = await fetch('/api/secure-messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: me,
        receiver: selected.username,
        text: value,
      }),
    })
      .then((res) => res.json())
      .catch(() => ({
        success: false,
        message: 'Message send failed.',
      }))

    if (!data.success) {
      setNotice(data.message || 'Message send failed.')
    } else {
      await loadThread(me, selected.username)
      setUsers(await loadChatUsers(me))
    }

    setSending(false)
    scrollBottom()
  }

  return (
    <AuthGuard>
      <main className={`waFinalRoot ${mobileChatOpen ? 'chatOpen' : ''}`}>
        <section className="waFinalApp">
          <aside className="waFinalSidebar">
            <header className="waFinalTop">
              <div className="waFinalMe">
                <span>{firstLetter(me)}</span>
              </div>

              <div className="waFinalTopActions">
                <button type="button" title="Status">◎</button>
                <button type="button" title="Communities">👥</button>
                <button type="button" title="New chat">✚</button>
                <button type="button" title="Menu">⋮</button>
              </div>
            </header>

            <section className="waFinalTitle">
              <h1>Chats</h1>
              <button type="button" onClick={boot}>↻</button>
            </section>

            <label className="waFinalSearch">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search or start a new chat"
              />
            </label>

            <section className="waFinalFilters">
              {[
                ['all', 'All'],
                ['unread', 'Unread'],
                ['favorites', 'Favorites'],
                ['groups', 'Groups'],
                ['pinned', 'Pinned'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={activeFilter === key ? 'active' : ''}
                  onClick={() => setActiveFilter(key as FilterType)}
                >
                  {label}
                </button>
              ))}
            </section>

            <button type="button" className="waFinalArchived">
              <span>🗄️</span>
              <b>Archived</b>
              <small>12</small>
            </button>

            <section className="waFinalList">
              {loadingUsers ? (
                <div className="waFinalEmpty">Loading chats...</div>
              ) : visibleUsers.length === 0 ? (
                <div className="waFinalEmpty">
                  <b>No chats found</b>
                  <span>Try refresh or search another creator.</span>
                </div>
              ) : (
                visibleUsers.map((user) => {
                  const active = selected ? sameUser(selected.username, user.username) : false

                  return (
                    <button
                      type="button"
                      key={user.username}
                      className={`waFinalChatRow ${active ? 'active' : ''}`}
                      onClick={() => openChat(user)}
                    >
                      <span className="waFinalAvatar">
                        {validImage(user.avatarUrl) ? (
                          <img src={user.avatarUrl} alt={user.name} />
                        ) : (
                          <b>{firstLetter(user.name)}</b>
                        )}
                        {user.online && <i />}
                      </span>

                      <span className="waFinalChatText">
                        <b>
                          {user.name}
                          {user.verified && <em>✓</em>}
                        </b>
                        <small className={user.typing ? 'typing' : ''}>
                          {user.typing
                            ? 'typing...'
                            : user.lastMessage
                              ? `🔐 ${user.lastMessage}`
                              : user.bio || 'Tap to start chat'}
                        </small>
                      </span>

                      <span className="waFinalMeta">
                        <small>{timeLabel(user.lastAt)}</small>
                        {user.pinned && <b>📌</b>}
                        {user.muted && <b>🔕</b>}
                        {Boolean(user.unread) && <i>{user.unread}</i>}
                      </span>
                    </button>
                  )
                })
              )}
            </section>

            <section className="waFinalFoot">
              <span>🔒</span>
              <p>Your personal messages are encrypted in backend storage.</p>
            </section>
          </aside>

          <section className="waFinalConversation">
            {!selected ? (
              <div className="waFinalNoChat">
                <span>💬</span>
                <h2>VibeLoop Chat</h2>
                <p>Select a chat from the list to start messaging.</p>
              </div>
            ) : (
              <>
                <header className="waFinalChatHeader">
                  <button
                    type="button"
                    className="waFinalBack"
                    onClick={() => {
                      setMobileChatOpen(false)
                      window.history.replaceState(null, '', '/messages')
                    }}
                  >
                    ‹
                  </button>

                  <span className="waFinalAvatar small">
                    {validImage(selected.avatarUrl) ? (
                      <img src={selected.avatarUrl} alt={selected.name} />
                    ) : (
                      <b>{firstLetter(selected.name)}</b>
                    )}
                    {selected.online && <i />}
                  </span>

                  <div className="waFinalChatName">
                    <h2>
                      {selected.name}
                      {selected.verified && <em>✓</em>}
                    </h2>
                    <p>{selected.username} · {selected.typing ? 'typing...' : 'online'}</p>
                  </div>

                  <button type="button" title="Video call">📹</button>
                  <button type="button" title="Voice call">☎</button>
                  <button type="button" title="Search">⌕</button>
                  <a href={`/profile?username=${encodeURIComponent(selected.username)}`} title="Profile">⋮</a>
                </header>

                <section className="waFinalMessages">
                  <div className="waFinalDateChip">Today</div>

                  <div className="waFinalEncrypt">
                    🔐 Messages are end-to-end encrypted. No one outside this chat can read them.
                  </div>

                  {loadingChat ? (
                    <div className="waFinalState">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="waFinalState">
                      <b>No messages yet</b>
                      <span>Send first message to {selected.name}</span>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = sameUser(message.sender, me)

                      return (
                        <div className={`waFinalBubble ${mine ? 'mine' : 'their'}`} key={message.id}>
                          <p>{message.text}</p>
                          <small>
                            {timeLabel(message.createdAt)}
                            {mine && <em> ✓✓</em>}
                          </small>
                        </div>
                      )
                    })
                  )}

                  <div ref={bottomRef} />
                </section>

                {notice && <section className="waFinalNotice">{notice}</section>}

                <form className="waFinalComposer" onSubmit={sendMessage}>
                  <button type="button">😊</button>
                  <button type="button">📎</button>
                  <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Type a message"
                  />
                  <button type="button">🎙️</button>
                  <button type="submit" disabled={sending}>
                    {sending ? '…' : '➤'}
                  </button>
                </form>
              </>
            )}
          </section>
        </section>
      </main>
    </AuthGuard>
  )
}
