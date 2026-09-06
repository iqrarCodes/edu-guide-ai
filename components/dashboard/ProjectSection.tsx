'use client'

import Link from 'next/link'
import { Clock, X, Zap, ArrowRight } from 'lucide-react'
import { Project } from './types'

interface ProjectSectionProps {
  title: string
  icon: React.ElementType
  color: 'blue' | 'purple' | 'green'
  projects: Project[]
  emptyIcon: string
  emptyText: string
  createLink: string
  onLaunch: (project: Project) => void
  onDelete: (id: string) => void
}

export function ProjectSection({
  title,
  icon: Icon,
  color,
  projects,
  emptyIcon,
  emptyText,
  createLink,
  onLaunch,
  onDelete,
}: ProjectSectionProps) {
  const colorMap = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
  }
  const hoverBg = {
    blue: 'hover:bg-blue-50',
    purple: 'hover:bg-purple-50',
    green: 'hover:bg-green-50',
  }
  const linkColor = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
  }

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Icon className={`w-5 h-5 ${colorMap[color]}`} />
          {title}
        </h3>
        <Link
          href={createLink}
          className={`text-sm ${linkColor[color]} hover:${linkColor[color]} font-medium flex items-center gap-1`}
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-2">{emptyIcon}</div>
          <p className="text-sm">{emptyText}</p>
          <Link
            href={createLink}
            className={`mt-2 text-sm ${linkColor[color]} font-medium hover:underline inline-block`}
          >
            Create one →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`p-3 rounded-xl ${hoverBg[color]} dark:hover:bg-${color}-950/30 cursor-pointer transition group flex items-center justify-between`}
            >
              <div onClick={() => onLaunch(project)} className="flex-1">
                <p className="font-medium text-gray-800 dark:text-white text-sm">
                  {project.name}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(project.id)
                  }}
                  className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                >
                  <X size={14} />
                </button>
                <Zap size={16} className="text-gray-300 group-hover:opacity-100 transition opacity-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}