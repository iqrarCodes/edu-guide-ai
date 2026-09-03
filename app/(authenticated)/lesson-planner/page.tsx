'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, BookOpen, Trash2, ArrowRight, Clock, Loader2, Sparkles } from 'lucide-react'

export default function LessonPlannerList() {
  const router = useRouter()
  const supabase = createClient()

  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [topic, setTopic] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('45 mins')
  const [generating, setGenerating] = useState(false)

  const fetchPlans = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPlans(data)
    }
    setLoading(false)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !grade.trim() || !subject.trim()) {
      alert('Please fill in all fields')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/lesson-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          grade: grade.trim(),
          subject: subject.trim(),
          duration,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setShowModal(false)
      router.push(`/lesson-planner/${data.lessonPlanId}`)
    } catch (error: any) {
      alert(error.message || 'Failed to generate lesson plan')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson plan?')) return
    const { error } = await supabase
      .from('lesson_plans')
      .delete()
      .eq('id', id)
    if (!error) fetchPlans()
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              AI Lesson Planner
            </h1>
            <p className="text-gray-500 text-sm">Generate complete lesson plans with AI</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2"
          >
            <Plus size={18} /> New Lesson Plan
          </button>
        </div>

        {/* Plans List */}
        {plans.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl font-medium text-gray-500">No lesson plans yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first AI-powered lesson plan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{plan.topic}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.subject} • {plan.grade}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {plan.duration}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/lesson-planner/${plan.id}`)}
                  className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  View <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📚 New Lesson Plan</h2>
            <p className="text-sm text-gray-400 mb-6">Generate a complete AI-powered lesson plan.</p>
            <form onSubmit={handleGenerate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                <input
                  type="text"
                  placeholder="e.g., Photosynthesis, Quadratic Equations, World War II"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                  <input
                    type="text"
                    placeholder="e.g., Grade 7, Grade 10, 5th Grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    placeholder="e.g., Science, Math, History"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g., 45 mins, 1 hour, 90 mins"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 hover:shadow-lg"
                >
                  {generating ? (
                    <><Loader2 size={18} className="animate-spin inline mr-2" /> Generating...</>
                  ) : (
                    '🚀 Generate Lesson Plan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}