import { useState, useEffect, useRef } from 'react'

const BACKEND_URL = 'https://cartai-backend.onrender.com/chat'

function App() {
  const [userId] = useState(() => Math.random().toString(36).substring(7))
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('https://cartai-backend.onrender.com/health')
        setIsConnected(res.ok)
      } catch {
        setIsConnected(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: input
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      
      const agentMessage = { 
        role: 'assistant', 
        content: data.reply,
        searchReady: data.search_ready,
        history: data.history
      }
      setMessages(prev => [...prev, agentMessage])
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Check if message contains a recommendation (has ₹ symbol)
  const isRecommendation = (text) => {
    return text && text.includes('₹')
  }

  // Extract product link from recommendation text
  const extractLink = (text) => {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/)
    return urlMatch ? urlMatch[0] : null
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>cart.ai</h1>
          <div className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
        </div>
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome">
              <p>Tell me what you want to buy, and I'll find the best option across Flipkart and Amazon.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'assistant' && isRecommendation(msg.content) ? (
                  <div className="recommendation-card">
                    <p>{msg.content}</p>
                    {(() => {
                      const link = extractLink(msg.content)
                      return link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="view-product-btn">
                          View Product
                        </a>
                      ) : null
                    })()}
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message assistant">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What do you want to buy?"
          />
          <button onClick={sendMessage} disabled={isTyping}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App