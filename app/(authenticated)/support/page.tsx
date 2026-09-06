'use client'

import { useState } from 'react'
import { LifeBuoy, MessageCircle, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

const faqs = [
  { q: 'How do I create a new project?', a: 'Click the "New Project" button on your dashboard, fill in the name and type, and click "Create Project".' },
  { q: 'What export formats are supported?', a: 'You can export slides as PPTX and DOCX (PDF coming soon). Quizzes can be exported as PDF.' },
  { q: 'Is my data safe?', a: 'Yes, all data is encrypted and stored securely. We use Supabase with RLS policies.' },
  { q: 'Can I collaborate with others?', a: 'Collaboration features are coming soon. Stay tuned!' },
]

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = () => {
    if (!message.trim()) return toast.error('Please write a message')
    setSending(true)
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you soon.')
      setMessage('')
      setSending(false)
    }, 1000)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <LifeBuoy className="text-purple-600" /> Help & Support
      </h1>
      <p className="text-gray-500 mt-1">Find answers to common questions or contact us.</p>

      {/* FAQ */}
      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">Frequently Asked Questions</h2>
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-800 hover:bg-gray-50 rounded-xl transition"
            >
              {faq.q}
              {openIndex === idx ? <ChevronUp size={18} className="text-purple-600" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {openIndex === idx && (
              <div className="p-4 pt-0 text-gray-600 text-sm border-t border-gray-100">{faq.a}</div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <MessageCircle size={20} className="text-purple-600" /> Contact Support
        </h2>
        <p className="text-sm text-gray-500 mt-1">Send us a message and we'll respond within 24 hours.</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue..."
          rows={4}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-4 focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 disabled:opacity-50"
        >
          <Mail size={18} /> {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  )
}