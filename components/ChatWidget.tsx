'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, X, Send, Upload, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function ChatWidget() {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (!isLoggedIn || !isOpen) return

    const fetchHistory = async () => {
      const res = await fetch('/api/chat/history')
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    }
    fetchHistory()
  }, [isLoggedIn, isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() && !file) return
    if (!isLoggedIn) {
      alert('Please login to use the chatbot.')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('message', input.trim() || 'Summarize this file')
    if (file) {
      formData.append('file', file)
    }

    const tempUserMsg = { id: Date.now(), message: input.trim() || '📄 Analyzing file...', is_ai: false, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempUserMsg])
    setInput('')
    setFile(null)

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')

      setMessages(prev => [...prev, {
        id: data.id,
        message: data.message,
        is_ai: true,
        created_at: new Date().toISOString(),
      }])
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        message: `❌ ${error.message}`,
        is_ai: true,
        created_at: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  if (!isLoggedIn) return null

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center gap-2">
            <Sparkles size={20} />
            <span className="font-bold">EduGuide AI Assistant</span>
            <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">v1.0</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-sm">Ask me anything!</p>
                <p className="text-xs">Upload a file for contextual answers</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.is_ai ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.is_ai
                      ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                    }`}
                >
                  {/* ✅ Use ReactMarkdown for AI messages */}
                  {msg.is_ai ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.message}</ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.message}</span>
                  )}
                  <span className="text-[10px] opacity-50 block mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-xl rounded-tl-none">
                  <Loader2 size={18} className="animate-spin text-purple-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File upload indicator */}
          {file && (
            <div className="px-4 py-1 bg-purple-50 text-xs text-purple-700 flex items-center gap-2">
              <span>📎 {file.name}</span>
              <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
            <label className="cursor-pointer text-gray-400 hover:text-purple-600 transition">
              <Upload size={20} />
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={file ? 'Ask about this file...' : 'Ask a question...'}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2 rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}