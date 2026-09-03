'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, FileText, Sparkles, Trash2, ArrowRight, Clock, Loader2 } from 'lucide-react'

export default function SlidesList() {
  const router = useRouter()
  const supabase = createClient()

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchSlides = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, name, description, created_at,
        slides_data (id, status, outline, slides)
      `)
      .eq('type', 'slides')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProjects(data)
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSubmitting(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    const { data: project, error } = await supabase
      .from('projects')
      .insert([{
        user_id: user?.id,
        type: 'slides',
        name: newName.trim(),
        description: newDesc.trim() || null,
      }])
      .select()
      .single()

    if (error) {
      alert('Failed to create project')
      console.error(error)
    } else {
      await supabase
        .from('slides_data')
        .insert([{
          project_id: project.id,
          status: 'draft',
        }])

      setNewName('')
      setNewDesc('')
      setShowModal(false)
      router.push(`/slides/${project.id}`)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slides project?')) return
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (!error) fetchSlides()
  }

  useEffect(() => {
    fetchSlides()
  }, [])

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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-purple-600" />
              AI Slides Generator
            </h1>
            <p className="text-gray-500 text-sm">Create and manage your AI-powered presentations</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2"
          >
            <Plus size={18} /> New Slides
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl font-medium text-gray-500">No slides projects yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first AI-powered presentation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs px-3 py-1 rounded-full ${project.slides_data?.[0]?.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {project.slides_data?.[0]?.status || 'draft'}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/slides/${project.id}`)}
                  className="mt-4 w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  Open <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 New Slides Project</h2>
            <p className="text-sm text-gray-400 mb-6">Create a new AI-powered presentation.</p>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g., AI in Education"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  placeholder="What is this presentation about?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
      )}
    </div>
  )
}