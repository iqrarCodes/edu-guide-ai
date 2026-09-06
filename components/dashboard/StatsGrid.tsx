'use client'

import { LayoutDashboard, FileText, HelpCircle, BookOpen } from 'lucide-react'

interface StatsGridProps {
  stats: {
    totalProjects: number
    slidesCount: number
    quizzesCount: number
    lessonPlansCount: number
  }
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { label: 'Total Projects', value: stats.totalProjects, icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
    { label: 'Slides', value: stats.slidesCount, icon: FileText, color: 'from-green-500 to-emerald-500' },
    { label: 'Quizzes', value: stats.quizzesCount, icon: HelpCircle, color: 'from-purple-500 to-pink-500' },
    { label: 'Lesson Plans', value: stats.lessonPlansCount, icon: BookOpen, color: 'from-orange-500 to-red-500' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/30 hover:shadow-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-10 group-hover:scale-110 transition`}
            >
              <stat.icon
                size={20}
                className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}