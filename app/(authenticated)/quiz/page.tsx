'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Brain, Trash2, ArrowRight, Clock, Loader2, Upload, Video, Sparkles } from 'lucide-react'

export default function QuizList() {
    const router = useRouter()
    const supabase = createClient()

    const [quizzes, setQuizzes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [sourceType, setSourceType] = useState('video')
    const [videoUrl, setVideoUrl] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [difficulty, setDifficulty] = useState('Medium')
    const [language, setLanguage] = useState('English')
    const [numMcqs, setNumMcqs] = useState(5)
    const [numShortQuestions, setNumShortQuestions] = useState(3)
    const [submitting, setSubmitting] = useState(false)

    const fetchQuizzes = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setQuizzes(data)
        }
        setLoading(false)
    }

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            let payload: any = {
                difficulty,
                language,
                numMcqs,
                numShortQuestions,
            }

            if (sourceType === 'video') {
                if (!videoUrl.trim()) {
                    alert('Please enter a YouTube URL')
                    setSubmitting(false)
                    return
                }
                payload.sourceType = 'video'
                payload.videoUrl = videoUrl.trim()
            } else {
                if (!file) {
                    alert('Please select a file')
                    setSubmitting(false)
                    return
                }
                payload.sourceType = 'file'
                payload.file = file
            }

            const formData = new FormData()
            Object.entries(payload).forEach(([key, value]) => {
                if (key === 'file') {
                    formData.append('file', value)
                } else {
                    formData.append(key, String(value))
                }
            })

            const res = await fetch('/api/quiz/generate', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Generation failed')

            setShowModal(false)
            router.push(`/quiz/${data.quizId}`)
        } catch (error: any) {
            alert(error.message || 'Failed to generate quiz')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this quiz?')) return
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', id)
        if (!error) fetchQuizzes()
    }

    useEffect(() => {
        fetchQuizzes()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <Brain className="w-8 h-8 text-purple-600" />
                            AI Quiz Generator
                        </h1>
                        <p className="text-gray-500 text-sm">Create and manage AI-powered quizzes</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2"
                    >
                        <Plus size={18} /> New Quiz
                    </button>
                </div>

                {/* Quiz List */}
                {quizzes.length === 0 ? (
                    <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
                        <div className="text-6xl mb-4">🧠</div>
                        <p className="text-xl font-medium text-gray-500">No quizzes yet</p>
                        <p className="text-gray-400 text-sm mt-1">Create your first AI-powered quiz</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 hover:shadow-xl transition-all hover:-translate-y-1"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">
                                            {quiz.source_type === 'video' ? '🎬 Video Quiz' : '📄 File Quiz'}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {quiz.difficulty} • {quiz.language}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {quiz.mcqs?.length || 0} MCQs • {quiz.short_questions?.length || 0} Short
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(quiz.id)}
                                        className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(quiz.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => router.push(`/quiz/${quiz.id}`)}
                                    className="mt-4 w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                                >
                                    Attempt <ArrowRight size={16} />
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
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">🧠 New Quiz</h2>
                        <p className="text-sm text-gray-400 mb-6">Generate a quiz from a YouTube video or uploaded file.</p>
                        <form onSubmit={handleGenerate}>
                            {/* Source Type */}
                            <div className="flex gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setSourceType('video')}
                                    className={`flex-1 py-2 rounded-xl font-medium transition ${sourceType === 'video' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    <Video size={16} className="inline mr-1" /> Video
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSourceType('file')}
                                    className={`flex-1 py-2 rounded-xl font-medium transition ${sourceType === 'file' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    <Upload size={16} className="inline mr-1" /> File
                                </button>
                            </div>

                            {sourceType === 'video' ? (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
                                    <input
                                        type="text"
                                        placeholder="https://youtu.be/..."
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload File *</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.gif,.bmp"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Supports: PDF, PPTX, DOCX, TXT, Images</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                                    >
                                        <option>English</option>
                                        <option>Urdu</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">MCQs</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={numMcqs ?? 5}    // ✅ Fallback to prevent undefined
                                        onChange={(e) => setNumMcqs(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Questions</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={numShortQuestions ?? 3}    // ✅ Fallback to prevent undefined
                                        onChange={(e) => setNumShortQuestions(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
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
                                    disabled={submitting}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 hover:shadow-lg"
                                >
                                    {submitting ? (
                                        <><Loader2 size={18} className="animate-spin inline mr-2" /> Generating...</>
                                    ) : (
                                        '🚀 Generate Quiz'
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