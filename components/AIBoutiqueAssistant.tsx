'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, X, Sparkles, ShoppingBag, Ruler, Calendar, User, UserPlus } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  action?: string
}

export default function AIBoutiqueAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Namaste! I'm Lalitha, your personal fashion consultant. I'm here to help you find the perfect outfit for any occasion. Looking for a stunning saree for a wedding, or a comfortable kurti for everyday wear? Just ask, and I'll find it for you! ✨",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-boutique-assistant', handleOpen)
    return () => window.removeEventListener('open-boutique-assistant', handleOpen)
  }, [])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/boutique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) })
      })

      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
      }
    } catch (error) {
      console.error('Failed to get AI response:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oh dear, I seem to have lost my thread for a moment. Could you try again? I'm eager to help you!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions = [
    "I need a saree for a wedding 🥻",
    "Show me comfortable kurtis 👗",
    "What fabric is best for summer? ☀️",
    "I want to book a styling session 📅"
  ]

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 z-[60] bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 group transition-all"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap px-0 group-hover:px-2">
          Consult Lalitha Aunty
        </span>
      </motion.button>

      {/* Main Chat Interface Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="glass-card bg-white/90 w-full max-w-2xl h-[80vh] flex flex-col rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border border-white/40"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/20 bg-gradient-to-r from-primary-500/10 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white">
                    🌸
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-sage-900 tracking-tight">Lalitha Aunty</h2>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-sage-500 font-medium tracking-wide uppercase">Styling Service • Online</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-all border border-white shadow-sm"
                >
                  <X className="w-5 h-5 text-sage-600" />
                </button>
              </div>

              {/* Chat Content */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar scroll-smooth">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] ${m.role === 'assistant' ? 'flex gap-3' : ''}`}>
                      {m.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-lg shadow-sm border border-white">
                          👵
                        </div>
                      )}
                      <div
                        className={`p-4 rounded-2xl shadow-sm border ${
                          m.role === 'assistant'
                            ? 'bg-white border-primary-50/50 text-sage-800 rounded-tl-none'
                            : 'bg-primary-600 border-primary-700 text-white rounded-tr-none'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed font-medium">{m.content}</p>
                        <div className={`text-[10px] mt-2 ${m.role === 'assistant' ? 'text-sage-400' : 'text-primary-100'} font-bold`}>
                          {m.timestamp}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/50 p-4 rounded-2xl flex items-center gap-2 border border-white">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary-600 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {messages.length === 1 && !isLoading && (
                <div className="px-8 py-4 flex flex-wrap gap-2 animate-fade-in">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(q)
                        // Trigger send automatically after a short delay
                        setTimeout(() => handleSendMessage(), 100)
                      }}
                      className="bg-white/60 hover:bg-white text-sage-700 text-sm font-semibold px-4 py-2 rounded-full border border-primary-100 transition-all hover:border-primary-400 hover:-translate-y-0.5 shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-8 border-t border-white/20 bg-white/50 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Aunty about styles, sizes, or fabrics..."
                    className="w-full bg-white border-2 border-primary-100 rounded-full px-8 py-4 pr-16 text-sage-800 placeholder:text-sage-400 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-inner"
                    disabled={isLoading}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="submit"
                    className="absolute right-2 top-2 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-all disabled:opacity-50"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </form>
                <div className="flex justify-center gap-6 mt-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sage-400 group cursor-help transition-colors">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="group-hover:text-primary-600">Browse Collections</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sage-400 group cursor-help transition-colors">
                    <Ruler className="w-3.5 h-3.5" />
                    <span className="group-hover:text-primary-600">Measurement Guide</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sage-400 group cursor-help transition-colors">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="group-hover:text-primary-600">Book Session</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .glass-card {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </>
  )
}
