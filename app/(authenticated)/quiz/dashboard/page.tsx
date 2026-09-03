'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
    Plus, Brain, FileText, Star, Sparkles, Clock, ArrowRight,
    Award, TrendingUp, HelpCircle, BookOpen, Video, Download
} from 'lucide-react'

export default function QuizDashboard() {
    const router = useRouter()
    const supabase = createClient()

    const [quizzes, setQuizzes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('Guest')

    const totalQuizzes = quizzes.length
    const totalAttempts = quizzes.reduce((acc, q) => acc + (q.attempts?.length || 0), 0)
    const avgScore = quizzes.length > 0
        ? Math.round(quizzes.reduce((acc, q) => acc + (q.attempts?.[0]?.percentage || 0), 0) / quizzes.length)
        : 0
    const recentQuizzes = quizzes.slice(0, 4)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guest')
            }

            const { data, error } = await supabase
                .from('quizzes')
                .select(`
          id,
          video_url,
          file_name,
          source_type,
          difficulty,
          language,
          created_at,
          attempts (id, score, total, percentage)
        `)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setQuizzes(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleOpenQuiz = (id: string) => {
        router.push(`/quiz/${id}`)
    }

    const quickActions = [
        {
            icon: <Plus size={20} />,
            label: 'New Quiz',
            action: () => router.push('/quiz'),
            color: 'from-purple-500 to-indigo-500',
        },
        {
            icon: <Brain size={20} />,
            label: 'Browse Quizzes',
            action: () => router.push('/quiz'),
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: <Download size={20} />,
            label: 'Export Analytics',
            action: () => alert('📊 Analytics export coming soon!'),
            color: 'from-green-500 to-emerald-500',
        },
    ]

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
                            <Sparkles className="w-8 h-8 text-purple-600" />
                            Quiz Dashboard
                        </h1>
                        <p className="text-gray-500 text-sm">Manage all your AI-generated quizzes</p>
                    </div>
                    <button
                        onClick={() => router.push('/quiz')}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2"
                    >
                        <Plus size={18} /> New Quiz
                    </button>
                </div>

                {/* Welcome */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold text-gray-800">
                        Welcome back, <span className="text-purple-600">{userName}</span>! 👋
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Here's an overview of your quizzes.</p>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Quizzes', value: totalQuizzes, icon: BookOpen, color: 'from-blue-500 to-cyan-500', delay: 0 },
                        { label: 'Total Attempts', value: totalAttempts, icon: Brain, color: 'from-purple-500 to-pink-500', delay: 0.1 },
                        { label: 'Avg Score', value: `${avgScore}%`, icon: Award, color: 'from-yellow-500 to-orange-500', delay: 0.2 },
                        { label: 'Questions Created', value: quizzes.reduce((acc, q) => acc + (q.mcqs?.length || 0), 0), icon: HelpCircle, color: 'from-green-500 to-emerald-500', delay: 0.3 },
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/30 hover:shadow-xl transition"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: stat.delay }}
                        >
                            <div className={`bg-gradient-to-r ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                                <stat.icon size={20} className="text-white" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickActions.map((action, idx) => (
                            <motion.button
                                key={idx}
                                onClick={action.action}
                                className={`bg-gradient-to-r ${action.color} text-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition flex items-center gap-3 group`}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                            >
                                <div className="bg-white/20 p-2 rounded-xl">{action.icon}</div>
                                <span className="font-medium">{action.label}</span>
                                <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition" />
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Recent Quizzes */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Clock size={18} className="text-purple-500" />
                            Recent Quizzes
                        </h3>
                        {quizzes.length > 4 && (
                            <button
                                onClick={() => router.push('/quiz')}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                View All
                            </button>
                        )}
                    </div>

                    {quizzes.length === 0 ? (
                        <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
                            <div className="text-6xl mb-4">🧠</div>
                            <p className="text-xl font-medium text-gray-500">No quizzes yet</p>
                            <p className="text-gray-400 text-sm mt-1">Create your first AI-powered quiz</p>
                            <button
                                onClick={() => router.push('/quiz')}
                                className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition"
                            >
                                + New Quiz
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recentQuizzes.map((quiz, idx) => {
                                const attempt = quiz.attempts?.[0]
                                const score = attempt ? `${Math.round(attempt.percentage)}%` : 'Not attempted'
                                return (
                                    <motion.div
                                        key={quiz.id}
                                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/30 hover:shadow-xl transition cursor-pointer group"
                                        whileHover={{ y: -6 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                                        onClick={() => handleOpenQuiz(quiz.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-800">
                                                    {quiz.video_url ? '🎬 Video Quiz' : '📄 File Quiz'}
                                                </h4>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {quiz.difficulty} • {quiz.language}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${attempt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {attempt ? 'Completed' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs text-gray-400">
                                                {new Date(quiz.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-sm font-bold text-purple-600">{score}</span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}