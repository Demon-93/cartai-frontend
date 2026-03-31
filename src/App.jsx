import { useState, useEffect, useRef } from 'react'
import './App.css'

const BACKEND_URL = 'https://cartai-backend.onrender.com/chat'

function TypingIndicator() {
  return (
    <div className="message assistant">
      <div className="avatar">AI</div>
      <div className="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isRec = msg.role === 'assistant' && msg.content && msg.content.includes('₹')
  const urlMatch = msg.content && msg.content.match(/(https?:\/\/[^\s]+)/)
  const link = urlMatch ? urlMatch[0] : null

  if (msg.role === 'user') {
    return (
      <div className="message user">
        <div className="bubble user-bubble">{msg.content}</div>
      </div>
    )
  }

  if (isRec) {
    return (
      <div className="message assistant">
        <div className="avatar">AI</div>
        <div className="rec-card">
          <div className="rec-label">Best Pick</div>
          <p className="rec-text">{msg.content}</p>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="view-btn">
              View Product →
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="message assistant">
      <div className="avatar">AI</div>
      <div className="bubble assistant-bubble">{msg.content}</div>
    </div>
  )
}

function App() {
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substring(2, 9))
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isTyping) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message: text })
      })

      if (!response.ok) throw new Error('Server error')
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.'
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">cart.ai</div>
        <div className="tagline">Your buying decision engine</div>
      </header>

      <main className="chat-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h2>What do you want to buy?</h2>
            <p>Tell me what you need and I'll find the best deal across Flipkart and Amazon.</p>
            <div className="suggestions">
              {['Wireless earphones under ₹1500', 'Men\'s casual tshirt size L', 'Gaming mouse under ₹2000'].map(s => (
                <button key={s} className="suggestion-chip" onClick={() => {
                  setInput(s)
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </main>

      <footer className="input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Tell me what you want to buy..."
          disabled={isTyping}
          autoFocus
        />
        <button onClick={sendMessage} disabled={isTyping || !input.trim()} className="send-btn">
          {isTyping ? '...' : 'Send'}
        </button>
      </footer>
    </div>
  )
}

export default App
