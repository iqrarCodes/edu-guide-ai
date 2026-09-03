'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Menu, X, Home, FileText, Presentation, HelpCircle, Video, BookOpen,
  LayoutDashboard, Library, History, Bookmark, Settings, LifeBuoy,
  Star, TrendingUp, Zap, Plus, ChevronRight, Clock, Award, LogOut,
  ArrowRight, MessageCircle, Sparkles,
} from 'lucide-react'
import ChatWidget from '@/components/ChatWidget'

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  // ----- User State -----
  const [userName, setUserName] = useState('Guest')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  // ----- Projects State (by type) -----
  const [slidesProjects, setSlidesProjects] = useState<any[]>([])
  const [quizzesProjects, setQuizzesProjects] = useState<any[]>([])
  const [lessonPlansProjects, setLessonPlansProjects] = useState<any[]>([])
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])

  // ----- Modal State -----
  const [showModal, setShowModal] = useState(false)

  // ----- Stats State -----
  const [stats, setStats] = useState({
    totalProjects: 0,
    slidesCount: 0,
    quizzesCount: 0,
    lessonPlansCount: 0,
    scriptsCount: 0,
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

  // ----- Fetch Projects (separated by type) -----
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

    // Store all projects
    setAllProjects(data || [])

    // Separate by type
    const slides = data?.filter(p => p.type === 'slides') || []
    const quizzes = data?.filter(p => p.type === 'quiz') || []
    const lessonPlans = data?.filter(p => p.type === 'lesson_plan') || []
    const scripts = data?.filter(p => p.type === 'script') || []

    setSlidesProjects(slides.slice(0, 3))
    setQuizzesProjects(quizzes.slice(0, 3))
    setLessonPlansProjects(lessonPlans.slice(0, 3))
    setRecentProjects(data?.slice(0, 4) || [])

    setStats({
      totalProjects: data?.length || 0,
      slidesCount: slides.length,
      quizzesCount: quizzes.length,
      lessonPlansCount: lessonPlans.length,
      scriptsCount: scripts.length,
    })
  }

  // ----- Add New Project -----
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
        // Refresh projects
        await fetchProjects(user.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      return
    }
    await fetchProjects(user.id)
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
    { icon: MessageCircle, label: 'AI Chat', href: '/chat' },
    { icon: Video, label: 'AI Videos', href: '/videos' },
    { icon: Library, label: 'My Library', href: '/library' },
    { icon: History, label: 'History', href: '/history' },
    { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: LifeBuoy, label: 'Help & Support', href: '/support' },
  ]

  // ----- Project type icons & colors (for display) -----
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

  const typeLabels: Record<string, string> = {
    slides: 'Slides',
    quiz: 'Quiz',
    lesson_plan: 'Lesson Plan',
    script: 'Script',
    video: 'Video',
    other: 'Other',
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
      {/* Sidebar (unchanged) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${item.active
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
              { label: 'Slides', value: stats.slidesCount, icon: FileText, color: 'from-green-500 to-emerald-500' },
              { label: 'Quizzes', value: stats.quizzesCount, icon: HelpCircle, color: 'from-purple-500 to-pink-500' },
              { label: 'Lesson Plans', value: stats.lessonPlansCount, icon: BookOpen, color: 'from-orange-500 to-red-500' },
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => router.push('/slides')}
              className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-4 group"
            >
              <div className="p-3 rounded-xl bg-blue-500/10 group-hover:scale-110 transition">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">New Slides</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create presentation</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-gray-400 group-hover:text-blue-600 transition" />
            </button>
            <button
              onClick={() => router.push('/quiz')}
              className="bg-purple-50 dark:bg-purple-950/30 p-5 rounded-2xl border border-purple-100/50 dark:border-purple-800/30 hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-4 group"
            >
              <div className="p-3 rounded-xl bg-purple-500/10 group-hover:scale-110 transition">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">New Quiz</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Generate quiz</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-gray-400 group-hover:text-purple-600 transition" />
            </button>
            <button
              onClick={() => router.push('/lesson-planner')}
              className="bg-green-50 dark:bg-green-950/30 p-5 rounded-2xl border border-green-100/50 dark:border-green-800/30 hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-4 group"
            >
              <div className="p-3 rounded-xl bg-green-500/10 group-hover:scale-110 transition">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">New Lesson Plan</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Plan your class</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-gray-400 group-hover:text-green-600 transition" />
            </button>
          </div>

          {/* Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Slides Section */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Recent Slides
                </h3>
                <Link href="/slides" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              {slidesProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm">No slides yet</p>
                  <button onClick={() => router.push('/slides')} className="mt-2 text-blue-600 text-sm font-medium hover:underline">
                    Create one →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {slidesProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleLaunch(project)}
                      className="p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition group flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white text-sm">{project.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Zap size={16} className="text-blue-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quizzes Section */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  Recent Quizzes
                </h3>
                <Link href="/quiz/dashboard" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              {quizzesProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-2">🧠</div>
                  <p className="text-sm">No quizzes yet</p>
                  <button onClick={() => router.push('/quiz')} className="mt-2 text-purple-600 text-sm font-medium hover:underline">
                    Create one →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzesProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleLaunch(project)}
                      className="p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 cursor-pointer transition group flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white text-sm">{project.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Zap size={16} className="text-purple-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lesson Plans Section */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  Recent Lesson Plans
                </h3>
                <Link href="/lesson-planner" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              {lessonPlansProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-sm">No lesson plans yet</p>
                  <button onClick={() => router.push('/lesson-planner')} className="mt-2 text-green-600 text-sm font-medium hover:underline">
                    Create one →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessonPlansProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleLaunch(project)}
                      className="p-3 rounded-xl hover:bg-green-50 dark:hover:bg-green-950/30 cursor-pointer transition group flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white text-sm">{project.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Zap size={16} className="text-green-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Projects (Mixed) */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Recent Projects
              </h3>
              <span className="text-xs text-gray-400">Latest creations</span>
            </div>
            {recentProjects.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <p className="text-sm">No projects yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleLaunch(project)}
                    className="p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition border border-gray-100 dark:border-gray-800 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{projectIcons[project.type] || '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{project.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{typeLabels[project.type] || 'Project'}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-400">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Project Modal (unchanged) */}
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

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}