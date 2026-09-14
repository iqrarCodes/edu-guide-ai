'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, BookOpen, Trash2, ArrowRight, Clock, Loader2, Upload, FileText, X } from 'lucide-react'

export default function LessonPlannerList() {
  const router = useRouter()
  const supabase = createClient()

  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // ✅ NEW: Source type - topic OR file
  const [sourceType, setSourceType] = useState<'topic' | 'file'>('topic')

  // Topic-based fields
  const [topic, setTopic] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('45 mins')

  // ✅ NEW: File-based fields
  const [file, setFile] = useState<File | null>(null)
  const [chapter, setChapter] = useState('')

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

    // Validation
    if (sourceType === 'topic') {
      if (!topic.trim() || !grade.trim() || !subject.trim()) {
        alert('Please fill in all fields')
        return
      }
    } else {
      if (!file) {
        alert('Please upload a file')
        return
      }
      if (!grade.trim() || !subject.trim()) {
        alert('Please fill in grade and subject')
        return
      }
    }

    setGenerating(true)
    try {
      // ✅ Build FormData (supports file upload)
      const formData = new FormData()
      formData.append('sourceType', sourceType)
      formData.append('grade', grade.trim())
      formData.append('subject', subject.trim())
      formData.append('duration', duration)

      if (sourceType === 'topic') {
        formData.append('topic', topic.trim())
      } else {
        formData.append('file', file!)
        formData.append('topic', file!.name.replace(/\.[^/.]+$/, '')) // use filename as topic
        if (chapter.trim()) formData.append('chapter', chapter.trim())
      }

      const res = await fetch('/api/lesson-planner/generate', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setShowModal(false)
      // Reset form
      setTopic('')
      setGrade('')
      setSubject('')
      setDuration('45 mins')
      setFile(null)
      setChapter('')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
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
          <div className="text-6xl mb-4"></div>
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-lg truncate">{plan.topic}</h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {plan.subject} • {plan.grade}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{plan.duration}</p>
                </div>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
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

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800"> New Lesson Plan</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Generate a lesson plan from a topic or uploaded lecture file.
            </p>

            <form onSubmit={handleGenerate}>
              {/* ✅ Source Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSourceType('topic')}
                    className={`p-4 rounded-xl border-2 text-center transition ${sourceType === 'topic'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200'
                      }`}
                  >
                    <span className="text-2xl block"></span>
                    Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('file')}
                    className={`p-4 rounded-xl border-2 text-center transition ${sourceType === 'file'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200'
                      }`}
                  >
                    <span className="text-2xl block"></span>
                    Lecture File
                  </button>
                </div>
              </div>

              {/* Topic-based */}
              {sourceType === 'topic' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                  <input
                    type="text"
                    placeholder="e.g., Photosynthesis, Quadratic Equations"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              )}

              {/* File-based */}
              {sourceType === 'file' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Lecture File *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                        required
                      />
                      {file && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <FileText size={16} className="text-blue-600" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs text-gray-400">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, DOCX, TXT supported
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specific Chapter/Section (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Chapter 4, Section 2.1"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Leave empty to use the entire file
                    </p>
                  </div>
                </>
              )}

              {/* Grade + Subject */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                  <input
                    type="text"
                    placeholder="e.g., Grade 10"
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
                    placeholder="e.g., Biology"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g., 45 mins, 1 hour"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Actions */}
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
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    ' Generate'
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