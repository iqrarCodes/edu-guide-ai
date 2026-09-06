'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { ProjectType } from './types'

interface AddProjectModalProps {
  show: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  projectName: string
  setProjectName: (name: string) => void
  projectType: ProjectType
  setProjectType: (type: ProjectType) => void
  projectDesc: string
  setProjectDesc: (desc: string) => void
  submitting: boolean
  setModalDirty: (dirty: boolean) => void
}

export function AddProjectModal({
  show,
  onClose,
  onSubmit,
  projectName,
  setProjectName,
  projectType,
  setProjectType,
  projectDesc,
  setProjectDesc,
  submitting,
  setModalDirty,
}: AddProjectModalProps) {
  if (!show) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🚀 Create New Project</h2>
        <p className="text-sm text-gray-400 mb-6">Add a new AI project to your dashboard.</p>
        <form
          onSubmit={onSubmit}
          onChange={() => {
            if (projectName.trim() || projectDesc.trim()) setModalDirty(true)
            else setModalDirty(false)
          }}
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              placeholder="e.g., Science Quiz Generator"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
            >
              <option value="slides">Slides Generator</option>
              <option value="quiz">Quiz Generator</option>
              <option value="lesson_plan">Lesson Planner</option>
              <option value="script">Script Writer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              placeholder="Brief description..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 hover:shadow-lg"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}