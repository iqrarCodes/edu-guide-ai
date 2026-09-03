'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function QuizPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const quizId = params.id

    const [quiz, setQuiz] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [mcqAnswers, setMcqAnswers] = useState<string[]>([])
    const [shortAnswers, setShortAnswers] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState<any>(null)

    useEffect(() => {
        const fetchQuiz = async () => {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', quizId)
                .single()

            if (error || !data) {
                router.push('/quiz')
                return
            }

            setQuiz(data)
            setMcqAnswers(new Array(data.mcqs?.length || 0).fill(''))
            setShortAnswers(new Array(data.short_questions?.length || 0).fill(''))

            // Check if already attempted
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: attemptData } = await supabase
                    .from('attempts')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('user_id', user.id)
                    .single()

                if (attemptData) {
                    setAttempt(attemptData)
                    setMcqAnswers(attemptData.mcq_answers || [])
                    setShortAnswers(attemptData.short_answers || [])
                }
            }

            setLoading(false)
        }
        fetchQuiz()
    }, [quizId])

    const handleMcqChange = (idx: number, value: string) => {
        if (attempt) return
        const newAnswers = [...mcqAnswers]
        newAnswers[idx] = value
        setMcqAnswers(newAnswers)
    }

    const handleShortChange = (idx: number, value: string) => {
        if (attempt) return
        const newAnswers = [...shortAnswers]
        newAnswers[idx] = value
        setShortAnswers(newAnswers)
    }

    const handleSubmit = async () => {
        if (attempt) {
            router.push('/quiz/dashboard')
            return
        }

        if (mcqAnswers.some(a => a === '')) {
            setError('Please answer all MCQs')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not logged in')

            // Calculate score locally (same logic as old)
            let mcqScore = 0
            const mcqFeedback = quiz.mcqs.map((mcq: any, i: number) => {
                const isCorrect = mcqAnswers[i] === mcq.correct
                if (isCorrect) mcqScore++
                return { question: mcq.question, your_answer: mcqAnswers[i], correct_answer: mcq.correct, is_correct: isCorrect, explanation: mcq.explanation }
            })

            let shortScore = 0
            const shortFeedback = quiz.short_questions.map((sq: any, i: number) => {
                const userAnswer = (shortAnswers[i] || '').toLowerCase()
                const keywords = sq.expected_keywords || []
                const isCorrect = keywords.some((kw: string) => userAnswer.includes(kw.toLowerCase()))
                if (isCorrect) shortScore++
                return { question: sq.question, your_answer: shortAnswers[i], expected_keywords: keywords, is_correct: isCorrect }
            })

            const total = quiz.mcqs.length + quiz.short_questions.length
            const totalCorrect = mcqScore + shortScore
            const percentage = (totalCorrect / total) * 100

            // Save attempt
            const { data: attemptData, error } = await supabase
                .from('attempts')
                .insert([{
                    quiz_id: quizId,
                    user_id: user.id,
                    mcq_answers: mcqAnswers,
                    short_answers: shortAnswers,
                    score: totalCorrect,
                    total: total,
                    percentage: percentage,
                }])
                .select()
                .single()

            if (error) throw error

            setAttempt(attemptData)
            alert(`✅ Quiz submitted! Score: ${totalCorrect}/${total}`)
        } catch (err: any) {
            setError(err.message || 'Submission failed')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!quiz) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-500">Quiz not found</div>
            </div>
        )
    }

    const totalQuestions = (quiz.mcqs?.length || 0) + (quiz.short_questions?.length || 0)
    const answered = mcqAnswers.filter(a => a !== '').length + shortAnswers.filter(a => a.trim() !== '').length
    const isComplete = answered === totalQuestions

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-purple-600 transition flex items-center gap-1 text-sm"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className="flex items-center gap-3">
                        {attempt && (
                            <span className="text-sm font-bold text-green-600">
                                ✅ Score: {attempt.score}/{attempt.total} ({Math.round(attempt.percentage)}%)
                            </span>
                        )}
                        <span className="text-sm text-gray-400">
                            {answered}/{totalQuestions} answered
                        </span>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {quiz.source_type === 'video' ? '🎬 Video Quiz' : '📄 File Quiz'}
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    {quiz.difficulty} • {quiz.language}
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Summary */}
                {quiz.summary && quiz.summary.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">📌 Smart Summary</h3>
                        <ul className="space-y-1.5">
                            {quiz.summary.map((point: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600">• {point}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* MCQs */}
                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">Q</span>
                        Multiple Choice Questions
                    </h3>
                    {quiz.mcqs?.map((mcq: any, idx: number) => {
                        const isAnswered = mcqAnswers[idx] !== ''
                        const isCorrect = attempt && mcqAnswers[idx] === mcq.correct
                        const isViewMode = !!attempt
                        return (
                            <div
                                key={idx}
                                className={`bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border transition ${attempt ? (isCorrect ? 'border-green-300' : isAnswered ? 'border-red-300' : 'border-gray-200') : 'border-white/30'
                                    }`}
                            >
                                <p className="font-semibold text-gray-800 mb-3">
                                    {idx + 1}. {mcq.question}
                                </p>
                                <div className="space-y-2">
                                    {mcq.options.map((opt: string, oi: number) => {
                                        const isSelected = mcqAnswers[idx] === opt
                                        let bg = 'hover:bg-gray-50'
                                        let border = 'border-gray-200'
                                        if (attempt) {
                                            if (opt === mcq.correct) {
                                                border = 'border-green-500'
                                                bg = 'bg-green-50'
                                            } else if (isSelected && opt !== mcq.correct) {
                                                border = 'border-red-500'
                                                bg = 'bg-red-50'
                                            }
                                        } else if (isSelected) {
                                            border = 'border-purple-500'
                                            bg = 'bg-purple-50'
                                        }
                                        return (
                                            <button
                                                key={oi}
                                                type="button"
                                                disabled={!!attempt}
                                                onClick={() => handleMcqChange(idx, opt)}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition ${border} ${bg}`}
                                            >
                                                {opt}
                                            </button>
                                        )
                                    })}
                                </div>
                                {attempt && isAnswered && mcq.explanation && (
                                    <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                        💡 {mcq.explanation}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Short Questions */}
                <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">A</span>
                        Short Answer Questions
                    </h3>
                    {quiz.short_questions?.map((sq: any, idx: number) => {
                        const userAnswer = shortAnswers[idx] || ''
                        const isCorrect = attempt && sq.expected_keywords?.some((kw: string) => userAnswer.toLowerCase().includes(kw.toLowerCase()))
                        return (
                            <div
                                key={idx}
                                className={`bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border transition ${attempt ? (isCorrect ? 'border-green-300' : userAnswer ? 'border-red-300' : 'border-gray-200') : 'border-white/30'
                                    }`}
                            >
                                <p className="font-semibold text-gray-800 mb-2">
                                    {idx + 1}. {sq.question}
                                </p>
                                {attempt ? (
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-sm"><strong>Your answer:</strong> {userAnswer || '(not answered)'}</p>
                                        {!isCorrect && userAnswer && (
                                            <p className="text-xs text-gray-500 mt-1">Expected keywords: {sq.expected_keywords?.join(', ')}</p>
                                        )}
                                        {isCorrect && (
                                            <p className="text-xs text-green-600 mt-1">✅ Correct! Contains expected keywords.</p>
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        rows={3}
                                        placeholder="Type your answer here..."
                                        value={userAnswer}
                                        onChange={(e) => handleShortChange(idx, e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Submit Button */}
                {!attempt && (
                    <button
                        onClick={handleSubmit}
                        disabled={!isComplete || submitting}
                        className={`w-full py-4 rounded-2xl font-bold text-white transition ${isComplete ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg' : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {submitting ? (
                            <><Loader2 size={18} className="animate-spin inline mr-2" /> Submitting...</>
                        ) : (
                            isComplete ? '🚀 Submit Quiz' : '🔒 Answer all questions to submit'
                        )}
                    </button>
                )}

                {attempt && (
                    <button
                        onClick={() => router.push('/quiz/dashboard')}
                        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg transition"
                    >
                        📊 Go to Dashboard
                    </button>
                )}
            </div>
        </div>
    )
}