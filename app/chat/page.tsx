'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'What goes with my denim skirt?',
  'Build me a casual weekend outfit',
  'What am I missing in my wardrobe?',
  'What should I wear to a job interview?',
  'Give me a date night look',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { checkUser() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
    setUserName(profile?.name || user.email?.split('@')[0] || 'there')
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, messages: newMessages })
    })

    const data = await res.json()
    if (data.message) {
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f7f3ee; font-family: 'Jost', sans-serif; height: 100%; }
        .navbar { position: sticky; top: 0; z-index: 100; background: rgba(247,243,238,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid #e8e0d5; display: flex; align-items: center; justify-content: space-between; padding: 0 5vw; height: 70px; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: #2c2420; letter-spacing: 0.03em; cursor: pointer; }
        .logo em { color: #c17b5c; font-style: normal; }
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .nav-link { background: none; border: none; font-family: 'Jost', sans-serif; font-size: 14px; color: #5a4a40; cursor: pointer; padding: 6px 4px; transition: color 0.2s; }
        .nav-link:hover { color: #2c2420; }
        .nav-pill { background: #2c2420; color: #f7f3ee; border: none; padding: 10px 24px; border-radius: 30px; font-family: 'Jost', sans-serif; font-size: 14px; cursor: pointer; transition: background 0.2s; }
        .nav-pill:hover { background: #c17b5c; }
        .chat-wrap { max-width: 1000px; margin: 0 auto; padding: 2rem 5vw 0; display: flex; flex-direction: column; height: calc(100vh - 70px); }
        .chat-header { margin-bottom: 1.5rem; flex-shrink: 0; }
        .messages { flex: 1; overflow-y: auto; padding-bottom: 1rem; }
        .bubble-wrap { display: flex; margin-bottom: 1.25rem; }
        .bubble-wrap.user { justify-content: flex-end; }
        .bubble-wrap.assistant { justify-content: flex-start; }
        .bubble { max-width: 75%; padding: 14px 18px; border-radius: 20px; font-size: 14px; line-height: 1.65; }
        .bubble.user { background: #2c2420; color: #f7f3ee; border-bottom-right-radius: 4px; }
        .bubble.assistant { background: #fff; color: #2c2420; border: 1px solid #ede5dc; border-bottom-left-radius: 4px; }
        .stella-name { font-size: 11px; color: #9a8a80; margin-bottom: 5px; letter-spacing: 0.04em; text-transform: uppercase; }
        .suggestions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem; flex-shrink: 0; }
        .suggestion-pill { padding: 8px 16px; border-radius: 30px; border: 1px solid #d9cfc7; background: #fff; font-family: 'Jost', sans-serif; font-size: 13px; color: #5a4a40; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .suggestion-pill:hover { border-color: #c17b5c; color: #c17b5c; background: #fdf0e8; }
        .input-bar { display: flex; gap: 10px; padding: 1rem 0 1.5rem; flex-shrink: 0; border-top: 1px solid #e8e0d5; }
        .chat-input { flex: 1; padding: 14px 18px; border: 1.5px solid #d9cfc7; border-radius: 14px; font-family: 'Jost', sans-serif; font-size: 14px; background: #fff; color: #2c2420; outline: none; transition: border-color 0.2s; }
        .chat-input:focus { border-color: #c17b5c; }
        .send-btn { padding: 14px 24px; background: #2c2420; color: #f7f3ee; border: none; border-radius: 14px; font-family: 'Jost', sans-serif; font-size: 14px; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
        .send-btn:hover:not(:disabled) { background: #c17b5c; }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .typing { display: flex; gap: 5px; align-items: center; padding: 14px 18px; background: #fff; border: 1px solid #ede5dc; border-radius: 20px; border-bottom-left-radius: 4px; width: fit-content; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: #c17b5c; animation: bounce 1.2s infinite; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>

      <nav className="navbar">
        <div className="logo" onClick={() => router.push('/')}>dres<em>s</em>ed</div>
        <div className="nav-right">
          <button className="nav-link" onClick={() => router.push('/profile')}>Profile</button>
          <button className="nav-pill" onClick={() => router.push('/outfit')}>✨ What should I wear?</button>
          <button className="nav-link" onClick={() => router.push('/')}>My Closet</button>
        </div>
      </nav>

      <div className="chat-wrap">
        <div className="chat-header">
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 500, color: '#2c2420', lineHeight: 1.1 }}>
            Stella, your AI stylist
          </h1>
          <p style={{ color: '#7a6a60', fontSize: '14px', marginTop: '8px' }}>
            Ask me anything about your wardrobe, outfits, or style.
          </p>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="bubble-wrap assistant">
                <div>
                  <p className="stella-name">Stella</p>
                  <div className="bubble assistant">
                    Hey {userName}! 👋 I'm Stella, your personal stylist. I know exactly what's in your wardrobe — ask me anything! What are you trying to put together today?
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`bubble-wrap ${msg.role}`}>
              <div>
                {msg.role === 'assistant' && <p className="stella-name">Stella</p>}
                <div className={`bubble ${msg.role}`}>{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="bubble-wrap assistant">
              <div>
                <p className="stella-name">Stella</p>
                <div className="typing">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {messages.length === 0 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="suggestion-pill" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="input-bar">
          <input
            className="chat-input"
            type="text"
            placeholder="Ask Stella anything about your style..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          />
          <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </>
  )
}
