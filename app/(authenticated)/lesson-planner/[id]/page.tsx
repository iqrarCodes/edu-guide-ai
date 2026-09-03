'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BookOpen, CheckCircle, Clock, Users, FileText, Download } from 'lucide-react'

export default function LessonPlanView() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const planId = params.id

  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlan = async () => {
      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (error || !data) {
        router.push('/lesson-planner')
        return
      }
      setPlan(data)
      setLoading(false)
    }
    fetchPlan()
  }, [planId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Lesson plan not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-blue-600 transition flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('📥 Export feature coming soon!')}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition flex items-center gap-1"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-white/30 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{plan.topic}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><BookOpen size={16} /> {plan.subject}</span>
            <span className="flex items-center gap-1"><Users size={16} /> {plan.grade}</span>
            <span className="flex items-center gap-1"><Clock size={16} /> {plan.duration}</span>
          </div>
        </div>

        {/* Objectives */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Learning Objectives
          </h2>
          <ul className="space-y-2">
            {plan.objectives?.map((obj: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>

        {/* Activities */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Activities
          </h2>
          <div className="space-y-4">
            {plan.activities?.map((activity: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.type === 'group' ? 'bg-purple-100 text-purple-700' :
                    activity.type === 'individual' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {activity.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">⏱ {activity.duration}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Assessments */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-red-600" />
            Assessments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.assessments?.map((assessment: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border ${
                assessment.type === 'formative' ? 'border-blue-200 bg-blue-50/50' : 'border-red-200 bg-red-50/50'
              }`}>
                <p className="text-sm font-medium text-gray-800">{assessment.type}</p>
                <p className="text-sm text-gray-600">{assessment.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Homework & Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30">
            <h2 className="text-lg font-bold text-gray-800 mb-3">📝 Homework</h2>
            <p className="text-sm text-gray-600">{plan.homework}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30">
            <h2 className="text-lg font-bold text-gray-800 mb-3">📦 Materials</h2>
            <ul className="space-y-1">
              {plan.materials?.map((material: string, i: number) => (
                <li key={i} className="text-sm text-gray-600">• {material}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Teacher Notes */}
        {plan.teacher_notes && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-yellow-500">⭐</span> Teacher Notes
            </h2>
            <p className="text-sm text-gray-600">{plan.teacher_notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Generated on {new Date(plan.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  )
}