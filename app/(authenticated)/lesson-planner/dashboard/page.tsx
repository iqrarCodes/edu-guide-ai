'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Menu, X, Home, FileText, Presentation, HelpCircle, Video, BookOpen,
  LayoutDashboard, Library, History, Bookmark, Settings, LifeBuoy,
  Star, TrendingUp, Zap, Plus, ChevronRight, Clock, Award, LogOut,
  ArrowRight,
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  // ----- User State -----
  const [userName, setUserName] = useState('Guest')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  // ----- Projects State (from Supabase) -----
  const [projects, setProjects] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  // ----- Stats State -----
  const [stats, setStats] = useState({
    totalProjects: 0,
    slidesGenerated: 0,
    quizzesGenerated: 0,
    lessonPlansGenerated: 0,
    scriptsGenerated: 0,
  })

  // ----- Add Project Form State -----
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectType, setNewProjectType] = useState('slides')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ----- Sidebar -----
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ----- Fetch User & Projects -----
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guest')
        setUserEmail(user.email || '')
        await fetchProjects(user.id)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // ----- Fetch Projects from Supabase (direct) -----
  const fetchProjects = async (userId?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const uid = userId || user?.id
    if (!uid) return

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return
    }

    setProjects(data || [])
    setStats({
      totalProjects: data?.length || 0,
      slidesGenerated: data?.filter(p => p.type === 'slides').length || 0,
      quizzesGenerated: data?.filter(p => p.type === 'quiz').length || 0,
      lessonPlansGenerated: data?.filter(p => p.type === 'lesson_plan').length || 0,
      scriptsGenerated: data?.filter(p => p.type === 'script').length || 0,
    })
  }

  // ----- Add New Project to Supabase -----
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          name: newProjectName.trim(),
          type: newProjectType,
          description: newProjectDesc.trim() || null,
        }])
        .select()

      if (error) throw error

      if (data) {
        setProjects(prev => [data[0], ...prev])
        setStats(prev => ({
          ...prev,
          totalProjects: prev.totalProjects + 1,
          slidesGenerated: prev.slidesGenerated + (newProjectType === 'slides' ? 1 : 0),
          quizzesGenerated: prev.quizzesGenerated + (newProjectType === 'quiz' ? 1 : 0),
          lessonPlansGenerated: prev.lessonPlansGenerated + (newProjectType === 'lesson_plan' ? 1 : 0),
          scriptsGenerated: prev.scriptsGenerated + (newProjectType === 'script' ? 1 : 0),
        }))
      }

      setNewProjectName('')
      setNewProjectType('slides')
      setNewProjectDesc('')
      setShowModal(false)
    } catch (error) {
      console.error('Error adding project:', error)
      alert('Failed to add project.')
    } finally {
      setSubmitting(false)
    }
  }

  // ----- Delete Project -----
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      return
    }
    setProjects(prev => prev.filter(p => p.id !== id))
    setStats(prev => ({
      ...prev,
      totalProjects: prev.totalProjects - 1,
    }))
  }

  // ----- Launch Project -----
  const handleLaunch = (project: any) => {
    if (project.type === 'slides') {
      router.push(`/slides/${project.id}`)
    } else if (project.type === 'quiz') {
      router.push(`/quiz/${project.id}`)
    } else if (project.type === 'lesson_plan') {
      router.push(`/lesson-planner/${project.id}`)
    } else if (project.type === 'script') {
      router.push(`/script/${project.id}`)
    } else {
      alert(`Launching ${project.name}... (Feature coming soon)`)
    }
  }

  // ----- Logout -----
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ----- Home -----
  const goHome = () => router.push('/')

  // ----- Sidebar nav items -----
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: FileText, label: 'AI Slides', href: '/slides/dashboard' },
    { icon: HelpCircle, label: 'AI Quizzes', href: '/quiz/dashboard' },
    { icon: BookOpen, label: 'Lesson Planner', href: '/lesson-planner' },
    { icon: Video, label: 'AI Videos', href: '/videos' },
    { icon: Library, label: 'My Library', href: '/library' },
    { icon: History, label: 'History', href: '/history' },
    { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: LifeBuoy, label: 'Help & Support', href: '/support' },
  ]

  // ----- Project type icons & colors -----
  const projectIcons: Record<string, string> = {
    slides: '📊',
    quiz: '🧠',
    lesson_plan: '📚',
    script: '📝',
    video: '🎬',
    other: '📦',
  }

  const projectColors: Record<string, string> = {
    slides: 'from-blue-500 to-cyan-500',
    quiz: 'from-purple-500 to-pink-500',
    lesson_plan: 'from-green-500 to-emerald-500',
    script: 'from-orange-500 to-red-500',
    video: 'from-red-500 to-orange-500',
    other: 'from-gray-500 to-gray-600',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:shadow-sm border-r border-gray-200/50`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200/50">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              EduGuide AI+
            </h1>
            <p className="text-xs text-gray-400 mt-1">Your AI Learning Companion</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  item.active
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100/70 hover:text-purple-600'
                }`}
                onClick={() => {
                  if (item.href) router.push(item.href)
                }}
              >
                <item.icon size={18} />
                {item.label}
                {item.active && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-purple-500" />
                )}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200/50">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={18} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-sm">Upgrade to Pro</span>
                </div>
                <p className="text-xs text-purple-100 mb-3">Unlock unlimited projects & advanced AI features.</p>
                <button className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 rounded-xl transition flex items-center justify-center gap-2">
                  <Zap size={14} /> Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-200/50 p-4 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-bold text-purple-600">EduGuide AI+</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                  <span>👋 Welcome back,</span>
                  <span className="bg-white/20 px-4 py-1 rounded-full text-2xl">{userName}!</span>
                </h2>
                <p className="text-purple-100 mt-2 max-w-xl">
                  Your AI-powered learning hub is ready. Continue your journey with smart tools.
                </p>
                <p className="text-xs text-purple-200/70 mt-1">{userEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-white text-purple-700 px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2 hover:scale-105"
                >
                  <Plus size={20} /> New Project
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-2xl font-medium transition flex items-center gap-2"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Projects', value: stats.totalProjects, icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
              { label: 'Slides Created', value: stats.slidesGenerated, icon: FileText, color: 'from-green-500 to-emerald-500' },
              { label: 'Quizzes Generated', value: stats.quizzesGenerated, icon: HelpCircle, color: 'from-purple-500 to-pink-500' },
              { label: 'Lesson Plans', value: stats.lessonPlansGenerated, icon: BookOpen, color: 'from-orange-500 to-red-500' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/30 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-10 group-hover:scale-110 transition`}>
                    <stat.icon size={20} className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Projects Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">🚀 Your Projects</h3>
                <p className="text-sm text-gray-500">Manage all your AI-generated content in one place.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2 text-sm"
              >
                <Plus size={18} /> New Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
                <div className="text-6xl mb-4">🌱</div>
                <p className="text-xl font-medium text-gray-500">No projects yet</p>
                <p className="text-gray-400 text-sm mt-1">Start your first project by clicking <span className="text-purple-600 font-medium">New Project</span></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{projectIcons[project.type] || '📦'}</span>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">{project.name}</h4>
                          <p className="text-xs text-gray-400 capitalize">{project.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{project.description}</p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${projectColors[project.type] || 'from-gray-400 to-gray-500'} text-white`}>
                        {project.type || 'general'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleLaunch(project)}
                      className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 group-hover:shadow-md"
                    >
                      <Zap size={16} /> Launch
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions / Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100/50 hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-800">AI Slides Generator</h4>
              </div>
              <p className="text-sm text-gray-600">Create professional presentations with AI in seconds.</p>
              <button onClick={() => router.push('/slides/dashboard')} className="mt-4 text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition text-sm">
                Get Started <ArrowRight size={14} />
              </button>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100/50 hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-800">AI Quiz Generator</h4>
              </div>
              <p className="text-sm text-gray-600">Generate quizzes from videos, files, or any topic.</p>
              <button onClick={() => router.push('/quiz/dashboard')} className="mt-4 text-purple-600 font-medium flex items-center gap-1 hover:gap-2 transition text-sm">
                Get Started <ArrowRight size={14} />
              </button>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100/50 hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-800">AI Lesson Planner</h4>
              </div>
              <p className="text-sm text-gray-600">Generate complete lesson plans with AI.</p>
              <button onClick={() => router.push('/lesson-planner')} className="mt-4 text-green-600 font-medium flex items-center gap-1 hover:gap-2 transition text-sm">
                Get Started <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🚀 Create New Project</h2>
            <p className="text-sm text-gray-400 mb-6">Add a new AI project to your dashboard.</p>
            <form onSubmit={handleAddProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Science Quiz Generator"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="slides">Slides Generator</option>
                  <option value="quiz">Quiz Generator</option>
                  <option value="lesson_plan">Lesson Planner</option>
                  <option value="script">Script Writer</option>
                  <option value="video">Video Creator</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  placeholder="Brief description of this project..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
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