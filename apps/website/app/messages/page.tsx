'use client'

import { FormEvent, useEffect, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

type MessageItem = {
  id: string
  sender: string
  receiver: string
  text: string
  createdAt: string
  readAt?: string | null
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
  const clean = String(value || '').trim()
  if (!clean) return '@creator'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function firstLetter(value?: string) {
  return String(value || 'V').trim().slice(0, 1).toUpperCase()
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
  const [me, setMe] = useState('@you')
  const [recipient, setRecipient] = useState('@creator')
  const [recipientInput, setRecipientInput] = useState('@creator')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  async function loadConversations(user: string) {
    const data = await fetch(`/api/messages/conversations?user=${encodeURIComponent(user)}`, {
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
        `/api/messages/thread?user=${encodeURIComponent(user)}&with=${encodeURIComponent(other)}`,
        { cache: 'no-store' }
      ).then((res) => res.json())

      setMessages(Array.isArray(data.messages) ? data.messages : [])

      if (!data.success) {
        setNotice(data.message || 'Message thread failed.')
      }
    } catch {
      setMessages([])
      setNotice('Backend message connection failed.')
    } finally {
      setLoading(false)
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

    const nextUrl = `/messages?to=${encodeURIComponent(target)}`
    window.history.replaceState(null, '', nextUrl)

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
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: me,
          receiver: recipient,
          text: cleanText
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Send failed.')
      }

      setText('')
      await loadThread(me, recipient)
      await loadConversations(me)
    } catch (error: any) {
      setNotice(error?.message || 'Send failed.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="creators" title="" subtitle="" hideSearch>
        <main className="vlxMessagesPage">
          <header className="vlxMessagesHeader">
            <a href="/home">‹</a>

            <div>
              <h1>Messages</h1>
              <p>Chat with {recipient}</p>
            </div>

            <button type="button" onClick={() => loadThread(me, recipient)}>
              Refresh
            </button>
          </header>

          <form className="vlxRecipientBar" onSubmit={handleRecipientSubmit}>
            <span>To</span>
            <input
              value={recipientInput}
              onChange={(event) => setRecipientInput(event.target.value)}
              placeholder="@username"
            />
            <button type="submit">Open</button>
          </form>

          {conversations.length > 0 && (
            <section className="vlxConversationStrip">
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
                    <small>{conversation.lastMessage}</small>
                  </span>
                </button>
              ))}
            </section>
          )}

          <section className="vlxChatPanel">
            <header className="vlxChatTop">
              <div className="vlxChatAvatar">
                {firstLetter(recipient)}
              </div>

              <div>
                <h2>{recipient.replace('@', '') || 'Creator'}</h2>
                <p>{recipient}</p>
              </div>
            </header>

            <div className="vlxMessageList">
              {loading ? (
                <div className="vlxMessageState">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="vlxMessageState">
                  <b>No messages yet</b>
                  <span>Start conversation with {recipient}.</span>
                </div>
              ) : (
                messages.map((message) => {
                  const mine = cleanUsername(message.sender).toLowerCase() === me.toLowerCase()

                  return (
                    <div className={`vlxMessageBubble ${mine ? 'mine' : 'their'}`} key={message.id}>
                      <p>{message.text}</p>
                      <small>{timeLabel(message.createdAt)}</small>
                    </div>
                  )
                })
              )}
            </div>

            {notice && <div className="vlxMessageNotice">{notice}</div>}

            <form className="vlxMessageComposer" onSubmit={handleSend}>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write message..."
              />
              <button type="submit" disabled={sending}>
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </section>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
