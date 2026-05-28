'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type Msg = {
  id: string
  sender: string
  receiver: string
  text: string
  createdAt: string
}

type UserItem = {
  id?: string
  name: string
  username: string
  bio?: string
  avatarUrl?: string
  verified?: boolean
}

type Conversation = {
  id: string
  username: string
  name: string
  lastMessage: string
  lastAt: string
  unread?: number
}

function cleanUsername(value?: string | null) {
  const v = String(value || '').trim()
  if (!v) return '@creator'
  return v.startsWith('@') ? v : `@${v}`
}

function letter(value?: string) {
  return String(value || 'U').replace('@', '').slice(0, 1).toUpperCase()
}

function isImg(url?: string) {
  const v = String(url || '')
  return v.startsWith('http') || v.startsWith('/media/') || v.startsWith('data:')
}

function timeLabel(value?: string) {
  if (!value) return ''
  const t = new Date(value).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const m = Math.max(1, Math.floor(diff / 60000))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function MessagesPage() {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const [me, setMe] = useState('@you')
  const [users, setUsers] = useState<UserItem[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Msg[]>([])
  const [selected, setSelected] = useState<UserItem | null>(null)
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [mobileChat, setMobileChat] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  function scrollDown() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
  }

  async function fetchUsers() {
    const data = await fetch('/api/users/list', { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => ({ users: [] }))

    return Array.isArray(data.users) ? data.users : []
  }

  async function fetchConversations(user: string) {
    const data = await fetch(`/api/secure-messages/conversations?user=${encodeURIComponent(user)}`, {
      cache: 'no-store'
    })
      .then((r) => r.json())
      .catch(() => ({ conversations: [] }))

    return Array.isArray(data.conversations) ? data.conversations : []
  }

  async function loadThread(user: string, other: string) {
    setLoadingChat(true)
    setNotice('')

    const data = await fetch(
      `/api/secure-messages/thread?user=${encodeURIComponent(user)}&with=${encodeURIComponent(other)}`,
      { cache: 'no-store' }
    )
      .then((r) => r.json())
      .catch(() => ({ success: false, messages: [], message: 'Message backend failed.' }))

    setMessages(Array.isArray(data.messages) ? data.messages : [])

    if (!data.success) {
      setNotice(data.message || 'Message backend failed.')
    }

    setLoadingChat(false)
    scrollDown()
  }

  async function openChat(user: UserItem) {
    const username = cleanUsername(user.username)
    const finalUser = { ...user, username }

    setSelected(finalUser)
    setMobileChat(true)
    window.history.replaceState(null, '', `/messages?to=${encodeURIComponent(username)}`)

    await loadThread(me, username)
  }

  async function boot() {
    setLoadingUsers(true)

    const session = await getSessionUser()
    const username = cleanUsername(session.username)
    setMe(username)

    const [allUsers, allConversations] = await Promise.all([
      fetchUsers(),
      fetchConversations(username)
    ])

    const safeUsers = allUsers
      .map((u: UserItem) => ({
        ...u,
        username: cleanUsername(u.username),
        name: u.name || cleanUsername(u.username).replace('@', '')
      }))
      .filter((u: UserItem) => u.username.toLowerCase() !== username.toLowerCase())

    setUsers(safeUsers)
    setConversations(allConversations)

    const params = new URLSearchParams(window.location.search)
    const to = params.get('to')
    const targetUsername = to ? cleanUsername(to) : cleanUsername(allConversations[0]?.username || safeUsers[0]?.username || '@creator')

    const target =
      safeUsers.find((u: UserItem) => cleanUsername(u.username).toLowerCase() === targetUsername.toLowerCase()) ||
      {
        name: targetUsername.replace('@', '') || 'Creator',
        username: targetUsername,
        bio: 'Secure chat'
      }

    setSelected(target)

    if (to || window.innerWidth >= 780) {
      await loadThread(username, targetUsername)
      setMobileChat(Boolean(to))
    }

    setLoadingUsers(false)
  }

  useEffect(() => {
    boot()
  }, [])

  const chatUsers = useMemo(() => {
    const map = new Map<string, UserItem & { lastMessage?: string; lastAt?: string; unread?: number }>()

    conversations.forEach((c) => {
      const u = cleanUsername(c.username)
      map.set(u.toLowerCase(), {
        username: u,
        name: c.name || u.replace('@', ''),
        bio: c.lastMessage || 'Encrypted message',
        lastMessage: c.lastMessage,
        lastAt: c.lastAt,
        unread: c.unread || 0,
        verified: true
      })
    })

    users.forEach((u) => {
      const username = cleanUsername(u.username)
      if (!map.has(username.toLowerCase())) {
        map.set(username.toLowerCase(), {
          ...u,
          username,
          name: u.name || username.replace('@', ''),
          bio: u.bio || 'Tap to start chat',
          lastMessage: '',
          lastAt: '',
          unread: 0
        })
      }
    })

    const q = search.trim().toLowerCase()
    return Array.from(map.values()).filter((u) => {
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        String(u.bio || '').toLowerCase().includes(q)
      )
    })
  }, [users, conversations, search])

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected || !text.trim()) return

    setSending(true)
    setNotice('')

    const body = {
      sender: me,
      receiver: selected.username,
      text: text.trim()
    }

    const data = await fetch('/api/secure-messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then((r) => r.json())
      .catch(() => ({ success: false, message: 'Send failed.' }))

    if (!data.success) {
      setNotice(data.message || 'Send failed.')
    } else {
      setText('')
      await loadThread(me, selected.username)
      setConversations(await fetchConversations(me))
    }

    setSending(false)
    scrollDown()
  }

  return (
    <AuthGuard>
      <SocialAppShell active="creators" hideSearch>
        <main className={`waPage ${mobileChat ? 'chatOpen' : ''}`}>
          <section className="waApp">
            <aside className="waList">
              <header className="waListHeader">
                <div className="waMyAvatar">{letter(me)}</div>
                <h1>Chats</h1>
                <div className="waListActions">
                  <a href="/search">⌕</a>
                  <a href="/create">+</a>
                </div>
              </header>

              <label className="waSearch">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search or start new chat"
                />
              </label>

              <div className="waChips">
                <button>All</button>
                <button>Unread</button>
                <button>Creators</button>
              </div>

              <div className="waUsers">
                {loadingUsers ? (
                  <div className="waEmpty">Loading chats...</div>
                ) : chatUsers.length === 0 ? (
                  <div className="waEmpty">No users found.</div>
                ) : (
                  chatUsers.map((u) => {
                    const active = selected?.username?.toLowerCase() === cleanUsername(u.username).toLowerCase()

                    return (
                      <button
                        type="button"
                        key={u.username}
                        onClick={() => openChat(u)}
                        className={`waUser ${active ? 'active' : ''}`}
                      >
                        <span className="waAvatar">
                          {isImg(u.avatarUrl) ? <img src={u.avatarUrl} alt={u.name} /> : <b>{letter(u.name)}</b>}
                          <i />
                        </span>

                        <span className="waUserText">
                          <b>
                            {u.name}
                            {u.verified && <em>✓</em>}
                          </b>
                          <small>{u.lastMessage ? `🔐 ${u.lastMessage}` : u.bio || 'Tap to chat'}</small>
                        </span>

                        <span className="waUserMeta">
                          <small>{timeLabel(u.lastAt)}</small>
                          {Boolean(u.unread) && <i>{u.unread}</i>}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </aside>

            <section className="waChat">
              {!selected ? (
                <div className="waNoChat">
                  <span>💬</span>
                  <h2>VibeLoop Web</h2>
                  <p>Select a chat to start secure encrypted messaging.</p>
                </div>
              ) : (
                <>
                  <header className="waChatHeader">
                    <button type="button" className="waBack" onClick={() => setMobileChat(false)}>
                      ‹
                    </button>

                    <span className="waAvatar small">
                      {isImg(selected.avatarUrl) ? (
                        <img src={selected.avatarUrl} alt={selected.name} />
                      ) : (
                        <b>{letter(selected.name)}</b>
                      )}
                      <i />
                    </span>

                    <div className="waChatTitle">
                      <h2>{selected.name}</h2>
                      <p>{selected.username} · online</p>
                    </div>

                    <a href={`/profile?username=${encodeURIComponent(selected.username)}`}>Profile</a>
                    <button type="button" onClick={() => loadThread(me, selected.username)}>↻</button>
                  </header>

                  <div className="waMsgArea">
                    <div className="waEncryptNote">🔐 Messages are encrypted in backend storage</div>

                    {loadingChat ? (
                      <div className="waChatState">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="waChatState">
                        <b>No messages yet</b>
                        <span>Send first message to {selected.name}</span>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const mine = cleanUsername(m.sender).toLowerCase() === me.toLowerCase()

                        return (
                          <div className={`waBubble ${mine ? 'mine' : 'their'}`} key={m.id}>
                            <p>{m.text}</p>
                            <small>{timeLabel(m.createdAt)} 🔐</small>
                          </div>
                        )
                      })
                    )}

                    <div ref={bottomRef} />
                  </div>

                  {notice && <div className="waNotice">{notice}</div>}

                  <form className="waComposer" onSubmit={send}>
                    <button type="button">😊</button>
                    <button type="button">📎</button>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type a message"
                    />
                    <button type="submit" disabled={sending}>
                      {sending ? '...' : '➤'}
                    </button>
                  </form>
                </>
              )}
            </section>
          </section>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
