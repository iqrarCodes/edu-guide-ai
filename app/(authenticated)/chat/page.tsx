'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Upload, Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export default function ChatPage() {
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [userName, setUserName] = useState('Guest')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guest')
      }

      const res = await fetch('/api/chat/history')
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() && !file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('message', input.trim() || 'Summarize this file')
    if (file) formData.append('file', file)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-purple-600 transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI Doubt Solver
            </h1>
            <p className="text-sm text-gray-500">Ask anything and get AI-powered answers</p>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/30 h-[500px] overflow-y-auto p-6 mb-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-lg font-medium">How can I help you today?</p>
              <p className="text-sm">Upload a file or ask a question</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.is_ai ? 'justify-start' : 'justify-end'} mb-4`}
            >
              <div
                className={`max-w-[75%] p-4 rounded-xl text-sm ${msg.is_ai
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
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 p-3 rounded-xl rounded-tl-none">
                <Loader2 size={20} className="animate-spin text-purple-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/30">
          {file && (
            <div className="mb-2 text-sm text-purple-600 flex items-center gap-2">
              <span>📎 {file.name}</span>
              <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer text-gray-400 hover:text-purple-600 transition">
              <Upload size={22} />
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={file ? 'Ask about this file...' : 'Ask a question...'}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-transparent"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={18} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}