'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    Plus, FileText, HelpCircle, BookOpen, Sparkles,
    Clock, ArrowRight, X, Menu, LayoutDashboard,
    History, Bookmark, Settings, LifeBuoy, MessageCircle,
    Library, LogOut, Star, Zap,
} from 'lucide-react'
import ChatWidget from '@/components/ChatWidget'

type Quiz = {
    id: string
    source_type: 'topic' | 'file'
    source_url: string
    difficulty: string
    language: string
    mcqs: any[]
    short_questions: any[]
    created_at: string
}

export default function QuizDashboard() {
    const router = useRouter()
    const supabase = createClient()
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [sourceType, setSourceType] = useState<'topic' | 'file'>('topic')
    const [topic, setTopic] = useState('')
    const [subtopics, setSubtopics] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [chapter, setChapter] = useState('')
    const [difficulty, setDifficulty] = useState('Medium')
    const [language, setLanguage] = useState('English')
    const [numMcqs, setNumMcqs] = useState(5)
    const [numShortQuestions, setNumShortQuestions] = useState(3)
    const [submitting, setSubmitting] = useState(false)

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        fetchQuizzes()
    }, [])

    const fetchQuizzes = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            toast.error('Failed to load quizzes')
        } else {
            setQuizzes(data || [])
        }
        setLoading(false)
    }

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const formData = new FormData()
        formData.append('sourceType', sourceType)
        formData.append('difficulty', difficulty)
        formData.append('language', language)
        formData.append('numMcqs', String(numMcqs))
        formData.append('numShortQuestions', String(numShortQuestions))

        if (sourceType === 'topic') {
            if (!topic.trim()) {
                toast.error('Please enter a topic')
                setSubmitting(false)
                return
            }
            formData.append('topic', topic)
            formData.append('subtopics', subtopics)
        } else {
            if (!file) {
                toast.error('Please upload a file')
                setSubmitting(false)
                return
            }
            formData.append('file', file)
            if (chapter.trim()) formData.append('chapter', chapter.trim())
        }

        try {
            const res = await fetch('/api/quiz/generate', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Generation failed')
            toast.success('Quiz generated! 🎉')
            setShowModal(false)
            // Reset form
            setTopic('')
            setSubtopics('')
            setFile(null)
            setChapter('')
            await fetchQuizzes()
            router.push(`/quiz/${data.quizId}`)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    // ----- Logout -----
    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // ----- Sidebar Nav -----
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: FileText, label: 'AI Slides', href: '/slides' },
        { icon: HelpCircle, label: 'AI Quizzes', href: '/quiz', active: true },
        { icon: BookOpen, label: 'Lesson Planner', href: '/lesson-planner' },
        { icon: MessageCircle, label: 'AI Chat', href: '/chat' },
        { icon: Library, label: 'My Library', href: '/library' },
        { icon: History, label: 'History', href: '/history' },
        { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
        { icon: Settings, label: 'Settings', href: '/settings' },
        { icon: LifeBuoy, label: 'Help & Support', href: '/support' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 lg:static lg:shadow-sm border-r border-gray-200/50 flex flex-col`}
            >
                <div className="p-4 border-b border-gray-200/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {localStorage.getItem('userName')?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                {localStorage.getItem('userName') || 'Guest'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                                {localStorage.getItem('userEmail') || ''}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${item.active
                                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100/70 hover:text-purple-600'
                                }`}
                            onClick={() => {
                                if (item.href) router.push(item.href)
                            }}
                        >
                            <item.icon size={18} />
                            {item.label}
                            {item.active && (
                                <span className="ml-auto w-2 h-2 rounded-full bg-purple-500" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200/50 space-y-3">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <Star size={16} className="fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-sm">Upgrade to Pro</span>
                        </div>
                        <p className="text-xs text-purple-100 mb-2">Unlock unlimited projects & advanced AI.</p>
                        <button
                            onClick={() => toast.info('Upgrade coming soon!')}
                            className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-1.5 rounded-lg transition"
                        >
                            <Zap size={12} className="inline mr-1" /> Upgrade Now
                        </button>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
                <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-200/50 p-4 flex items-center justify-between sticky top-0 z-40">
                    <h1 className="text-xl font-bold text-purple-600">EduGuide AI+</h1>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800"> AI Quiz Generator</h1>
                            <p className="text-gray-500">Create and manage AI-powered quizzes</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={20} /> New Quiz
                        </button>
                    </div>

                    {/* Quiz List */}
                    {quizzes.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                            <div className="text-6xl mb-4"></div>
                            <h3 className="text-xl font-semibold text-gray-700">No quizzes yet</h3>
                            <p className="text-gray-400 mt-1">Create your first quiz from a topic or file.</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition"
                            >
                                + Create Quiz
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quizzes.map((quiz) => (
                                <div
                                    key={quiz.id}
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                                    onClick={() => router.push(`/quiz/${quiz.id}`)}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">
                                            {quiz.source_type === 'topic' ? '' : ''}
                                        </span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                            {quiz.source_type === 'topic' ? 'Topic' : 'File'}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800 truncate">
                                        {quiz.source_type === 'topic'
                                            ? quiz.source_url || 'Topic Quiz'
                                            : quiz.source_url || 'File Quiz'}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                                            {quiz.difficulty}
                                        </span>
                                        <span>{quiz.language}</span>
                                        <span>•</span>
                                        <span>{quiz.mcqs?.length || 0} MCQs</span>
                                        <span>•</span>
                                        <span>{quiz.short_questions?.length || 0} Short</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                        <Clock size={12} />
                                        {new Date(quiz.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* ===== NEW QUIZ MODAL (Updated: Topic + File) ===== */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-800"> New Quiz</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-gray-500 mb-6">Generate a quiz from a topic or uploaded file.</p>

                        <form onSubmit={handleGenerate}>
                            {/* Source Selection */}
                            <div className="space-y-4 mb-6">
                                <label className="block text-sm font-medium text-gray-700">Source</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSourceType('topic')}
                                        className={`p-4 rounded-xl border-2 text-center transition ${sourceType === 'topic'
                                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-purple-200'
                                            }`}
                                    >
                                        <span className="text-2xl block"></span>
                                        Topic
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSourceType('file')}
                                        className={`p-4 rounded-xl border-2 text-center transition ${sourceType === 'file'
                                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-purple-200'
                                            }`}
                                    >
                                        <span className="text-2xl block"></span>
                                        File
                                    </button>
                                </div>
                            </div>

                            {/* Topic */}
                            {sourceType === 'topic' && (
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Enter Topic *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Python Programming, Quantum Physics"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subtopics (Optional)
                                        </label>
                                        <textarea
                                            placeholder="e.g., Loops, Functions, OOP Concepts"
                                            value={subtopics}
                                            onChange={(e) => setSubtopics(e.target.value)}
                                            rows={2}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* File */}
                            {sourceType === 'file' && (
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Upload File *
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.docx,.txt"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="w-full p-3 border border-gray-300 rounded-xl"
                                            required
                                        />
                                        {file && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Specific Chapter/Section (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Chapter 4, Section 2.1"
                                            value={chapter}
                                            onChange={(e) => setChapter(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Leave empty to use the entire file.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Settings */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="English">English</option>
                                        <option value="Urdu">Urdu</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Spanish">Spanish</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">MCQs</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={numMcqs}
                                        onChange={(e) => setNumMcqs(Number(e.target.value))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Questions</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={numShortQuestions}
                                        onChange={(e) => setNumShortQuestions(Number(e.target.value))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
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
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        ' Generate Quiz'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ChatWidget />
        </div>
    )
}