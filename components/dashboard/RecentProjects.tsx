'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Project } from './types'
import { ProjectCard } from './ProjectCard'

interface RecentProjectsProps {
  projects: Project[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onLaunch: (project: Project) => void
  onDelete: (id: string) => void
}

export function RecentProjects({
  projects,
  hasMore,
  loadingMore,
  onLoadMore,
  onLaunch,
  onDelete,
}: RecentProjectsProps) {
  return (
    <div className="bg-white/80 rounded-2xl p-6 shadow-sm border border-white/30">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Recent Projects
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Showing {projects.length} projects</span>
          <Link href="/library" className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚀</div>
          <h4 className="text-xl font-semibold text-gray-700">No projects yet</h4>
          <p className="text-gray-400 text-sm mt-1">Create your first project using the button above.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onLaunch={onLaunch}
                onDelete={onDelete}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-6 py-2 rounded-xl font-medium transition disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}