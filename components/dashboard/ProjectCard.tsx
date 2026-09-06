'use client'

import { X } from 'lucide-react'
import { Project, ProjectType } from './types'

interface ProjectCardProps {
  project: Project
  onLaunch: (project: Project) => void
  onDelete: (id: string) => void
}

const typeIcons: Record<ProjectType, string> = {
  slides: '📊',
  quiz: '🧠',
  lesson_plan: '📚',
  script: '📝',
  other: '📦',
}

const typeLabels: Record<ProjectType, string> = {
  slides: 'Slides',
  quiz: 'Quiz',
  lesson_plan: 'Lesson Plan',
  script: 'Script',
  other: 'Other',
}

export function ProjectCard({ project, onLaunch, onDelete }: ProjectCardProps) {
  return (
    <div
      className="p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition border border-gray-100 dark:border-gray-800 hover:shadow-md group"
      onClick={() => onLaunch(project)}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{typeIcons[project.type] || '📦'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
            {project.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{typeLabels[project.type] || 'Project'}</span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-400">
              {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(project.id)
          }}
          className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-50"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}