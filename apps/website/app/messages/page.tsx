'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type SecureMessage = {
  id: string
  sender: string
  receiver: string
  text: string
  createdAt: string
  readAt?: string | null
  mine?: boolean
  encrypted?: boolean
}

type Conversation = {
  id: string
  username: string
  name: string
  lastMessage: string
  lastAt: string
  encrypted?: boolean
  unread?: number
}

function cleanUsername(value?: string | null) {
  const clean = String(value || '').trim()
  if (!clean) return '@creator'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').replace('@', '').trim().slice(0, 1).toUpperCase()
}

function timeLabel(value?: string) {
  if (!value) return 'now'
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return 'now'

  const diff = Date.now() - time
  const min = Math.max(1, Math.floor(diff / 60000))
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export default function MessagesPage() {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const [me, setMe] = useState('@you')
  const [recipient, setRecipient] = useState('@creator')
  const [recipientInput, setRecipientInput] = useState('@creator')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<SecureMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }

  async function loadConversations(user: string) {
    const data = await fetch(`/api/secure-messages/conversations?user=${encodeURIComponent(user)}`, {
      cache: 'no-store'
    }).then((res) => res.json()).catch(() => ({
      conversations: []
    }))

    setConversations(Array.isArray(data.conversations) ? data.conversations : [])
  }

  async function loadThread(user: string, other: string) {
    setLoading(true)
    setNotice('')

    try {
      const data = await fetch(
        `/api/secure-messages/thread?user=${encodeURIComponent(user)}&with=${encodeURIComponent(other)}`,
        { cache: 'no-store' }
      ).then((res) => res.json())

      setMessages(Array.isArray(data.messages) ? data.messages : [])

      if (!data.success) {
        setNotice(data.message || 'Secure message thread failed.')
      }
    } catch {
      setMessages([])
      setNotice('Secure backend connection failed.')
    } finally {
      setLoading(false)
      scrollBottom()
    }
  }

  async function boot() {
    const session = await getSessionUser()
    const username = cleanUsername(session.username)

    const params = new URLSearchParams(window.location.search)
    const to = cleanUsername(params.get('to') || '@creator')

    setMe(username)
    setRecipient(to)
    setRecipientInput(to)

    await loadConversations(username)
    await loadThread(username, to)
  }

  useEffect(() => {
    boot()
  }, [])

  async function openConversation(username: string) {
    const target = cleanUsername(username)

    setRecipient(target)
    setRecipientInput(target)

    window.history.replaceState(null, '', `/messages?to=${encodeURIComponent(target)}`)

    await loadThread(me, target)
  }

  async function handleRecipientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await openConversation(recipientInput)
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanText = text.trim()
    if (!cleanText) return

    setSending(true)
    setNotice('')

    try {
      const response = await fetch('/api/secure-messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: me,
          receiver: recipient,
          text: cleanText
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Secure send failed.')
      }

      setText('')
      await loadThread(me, recipient)
      await loadConversations(me)
    } catch (error: any) {
      setNotice(error?.message || 'Secure send failed.')
    } finally {
      setSending(false)
      scrollBottom()
    }
  }

  async function archiveConversation() {
    const data = await fetch('/api/secure-messages/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: me, withUser: recipient })
    }).then((res) => res.json()).catch(() => ({
      success: false,
      message: 'Archive failed.'
    }))

    setNotice(data.message || 'Updated.')
    if (data.success) {
      setMessages([])
      await loadConversations(me)
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="creators" title="" subtitle="" hideSearch>
        <main className="vlxSecureMessagesPage">
          <header className="vlxSecureMessagesHeader">
            <a href="/home">‹</a>

            <div>
              <h1>Messages</h1>
              <p>Secure encrypted user-to-user chat.</p>
            </div>

            <button type="button" onClick={() => loadThread(me, recipient)}>
              Refresh
            </button>
          </header>

          <section className="vlxSecureHero">
            <span>🔐</span>
            <div>
              <b>AES-GCM secure storage</b>
              <small>Messages are encrypted before saving in backend database.</small>
            </div>
          </section>

          <form className="vlxSecureRecipientBar" onSubmit={handleRecipientSubmit}>
            <span>To</span>
            <input
              value={recipientInput}
              onChange={(event) => setRecipientInput(event.target.value)}
              placeholder="@username"
            />
            <button type="submit">Open</button>
          </form>

          {conversations.length > 0 && (
            <section className="vlxSecureConversationStrip">
              {conversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => openConversation(conversation.username)}
                  className={cleanUsername(conversation.username).toLowerCase() === recipient.toLowerCase() ? 'active' : ''}
                >
                  <i>{firstLetter(conversation.name || conversation.username)}</i>
                  <span>
                    <b>{conversation.name || conversation.username}</b>
                    <small>🔐 {conversation.lastMessage}</small>
                  </span>
                </button>
              ))}
            </section>
          )}

          <section className="vlxSecureChatPanel">
            <header className="vlxSecureChatTop">
              <div className="vlxSecureChatAvatar">{firstLetter(recipient)}</div>

              <div>
                <h2>{recipient.replace('@', '') || 'Creator'}</h2>
                <p>{recipient} · encrypted chat</p>
              </div>

              <button type="button" onClick={archiveConversation}>
                Hide
              </button>
            </header>

            <div className="vlxSecureMessageList">
              {loading ? (
                <div className="vlxSecureMessageState">Loading encrypted messages...</div>
              ) : messages.length === 0 ? (
                <div className="vlxSecureMessageState">
                  <b>No messages yet</b>
                  <span>Start secure conversation with {recipient}.</span>
                </div>
              ) : (
                messages.map((message) => {
                  const mine = cleanUsername(message.sender).toLowerCase() === me.toLowerCase()

                  return (
                    <div className={`vlxSecureBubble ${mine ? 'mine' : 'their'}`} key={message.id}>
                      <p>{message.text}</p>
                      <small>🔐 {timeLabel(message.createdAt)}</small>
                    </div>
                  )
                })
              )}

              <div ref={bottomRef} />
            </div>

            {notice && <div className="vlxSecureNotice">{notice}</div>}

            <form className="vlxSecureComposer" onSubmit={handleSend}>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write encrypted message..."
              />
              <button type="submit" disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </section>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
