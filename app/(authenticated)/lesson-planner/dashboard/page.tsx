'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  Plus, BookOpen, Star, Sparkles, Clock, ArrowRight,
  FileText, Users, Award, TrendingUp, Download
} from 'lucide-react'

export default function LessonPlannerDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Guest')

  const totalPlans = plans.length
  const totalSubjects = new Set(plans.map(p => p.subject)).size
  const totalGrades = new Set(plans.map(p => p.grade)).size
  const recentPlans = plans.slice(0, 4)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guest')
      }

      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPlans(data)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleOpenPlan = (id: string) => {
    router.push(`/lesson-planner/${id}`)
  }

  const quickActions = [
    {
      icon: <Plus size={20} />,
      label: 'New Lesson Plan',
      action: () => router.push('/lesson-planner'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <BookOpen size={20} />,
      label: 'Browse Plans',
      action: () => router.push('/lesson-planner'),
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: <Download size={20} />,
      label: 'Export All',
      action: () => alert('📦 Export coming soon!'),
      color: 'from-green-500 to-emerald-500',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            Lesson Planner Dashboard
          </h1>
          <p className="text-gray-500 text-sm">Manage all your AI-generated lesson plans</p>
        </div>
        <button
          onClick={() => router.push('/lesson-planner')}
          className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus size={18} /> New Lesson Plan
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
          Welcome back, <span className="text-blue-600">{userName}</span>! 👋
        </h2>
        <p className="text-gray-500 text-sm mt-1">Here's an overview of your lesson plans.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Plans', value: totalPlans, icon: BookOpen, color: 'from-blue-500 to-cyan-500', delay: 0 },
          { label: 'Subjects', value: totalSubjects, icon: FileText, color: 'from-purple-500 to-pink-500', delay: 0.1 },
          { label: 'Grades', value: totalGrades, icon: Users, color: 'from-yellow-500 to-orange-500', delay: 0.2 },
          { label: 'Avg Rating', value: '4.9', icon: Star, color: 'from-green-500 to-emerald-500', delay: 0.3 },
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

      {/* Recent Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" /> Recent Lesson Plans
          </h3>
          {plans.length > 4 && (
            <button
              onClick={() => router.push('/lesson-planner')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          )}
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl font-medium text-gray-500">No lesson plans yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first AI-powered lesson plan</p>
            <button
              onClick={() => router.push('/lesson-planner')}
              className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition"
            >
              + New Lesson Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentPlans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/30 hover:shadow-xl transition cursor-pointer group"
                whileHover={{ y: -6 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                onClick={() => handleOpenPlan(plan.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{plan.topic}</h4>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {plan.subject} • {plan.grade}
                    </p>
                  </div>
                  <span className="text-2xl">📚</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-400">
                    {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPlan(plan.id)
                    }}
                    className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-xl font-medium transition"
                  >
                    Open
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}