'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'

export default function MessagesPage() {
  const [to, setTo] = useState('@creator')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setTo(params.get('to') || '@creator')
  }, [])

  function sendMessage() {
    if (!text.trim()) return
    setMessages((old) => [...old, text.trim()])
    setText('')
  }

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="" hideSearch>
        <main className="simpleMessagePage">
          <header>
            <a href="/profile">‹</a>
            <div>
              <h1>Messages</h1>
              <p>Chat with {to}</p>
            </div>
          </header>

          <section className="simpleChatBox">
            {messages.length === 0 && <p>No messages yet. Start conversation.</p>}

            {messages.map((msg, index) => (
              <div className="simpleBubble" key={index}>{msg}</div>
            ))}
          </section>

          <footer className="simpleChatInput">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write message..." />
            <button onClick={sendMessage} type="button">Send</button>
          </footer>
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
