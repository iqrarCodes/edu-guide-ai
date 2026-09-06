'use client'

import { FileText, HelpCircle, BookOpen, ArrowRight } from 'lucide-react'

interface QuickActionProps {
  icon: React.ElementType
  label: string
  desc: string
  color: 'blue' | 'purple' | 'green'
  onClick: () => void
}

export function QuickActions({ actions }: { actions: QuickActionProps[] }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-100/50 text-blue-600',
    purple: 'bg-purple-50 border-purple-100/50 text-purple-600',
    green: 'bg-green-50 border-green-100/50 text-green-600',
  }
  const iconBg = {
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    green: 'bg-green-500/10',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          className={`p-5 rounded-2xl border ${colorMap[action.color]} hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-4 group`}
        >
          <div className={`p-3 rounded-xl ${iconBg[action.color]} group-hover:scale-110 transition`}>
            <action.icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">{action.label}</p>
            <p className="text-xs text-gray-500">{action.desc}</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-gray-400 group-hover:opacity-100 transition opacity-0" />
        </button>
      ))}
    </div>
  )
}