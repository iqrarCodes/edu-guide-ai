'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Menu, X, FileText, HelpCircle, BookOpen,
  LayoutDashboard, Library, History, Bookmark, Settings, LifeBuoy,
  Star, Zap, Plus, Clock, LogOut, ArrowRight, MessageCircle, Sparkles,
} from 'lucide-react'
import ChatWidget from '@/components/ChatWidget'   // ✅ BACK

// ============================================================
// TYPES
// ============================================================
type ProjectType = 'slides' | 'quiz' | 'lesson_plan' | 'script' | 'other'

interface Project {
  id: string
  user_id: string
  name: string
  type: ProjectType
  description?: string
  created_at: string
  updated_at?: string
}

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  // User state
  const [userName, setUserName] = useState('Guest')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  // Projects
  const [slidesProjects, setSlidesProjects] = useState<Project[]>([])
  const [quizzesProjects, setQuizzesProjects] = useState<Project[]>([])
  const [lessonPlansProjects, setLessonPlansProjects] = useState<Project[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])

  // Pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [modalDirty, setModalDirty] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalProjects: 0,
    slidesCount: 0,
    quizzesCount: 0,
    lessonPlansCount: 0,
    scriptsCount: 0,
  })

  // Form
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectType, setNewProjectType] = useState<ProjectType>('slides')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ============================================================
  // FETCH PROJECTS
  // ============================================================
  const fetchProjects = useCallback(
    async (userId?: string, pageNum = 1) => {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = userId || user?.id
      if (!uid) return { data: [], count: 0 }

      const limit = 10
      const offset = (pageNum - 1) * limit

      const { data, error, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error(error)
        toast.error('Failed to load projects')
        return { data: [], count: 0 }
      }

      return { data: data || [], count: count || 0 }
    },
    [supabase]
  )

  const loadProjects = useCallback(
    async (userId?: string, pageNum = 1, append = false) => {
      const { data, count } = await fetchProjects(userId, pageNum)
      const typedData = data as Project[]

      if (append) {
        setAllProjects((prev) => [...prev, ...typedData])
        setHasMore(typedData.length === 10)
      } else {
        setAllProjects(typedData)
        setHasMore(typedData.length === 10)
      }

      const slides = typedData.filter((p) => p.type === 'slides')
      const quizzes = typedData.filter((p) => p.type === 'quiz')
      const lessonPlans = typedData.filter((p) => p.type === 'lesson_plan')
      const scripts = typedData.filter((p) => p.type === 'script')

      setSlidesProjects(slides.slice(0, 3))
      setQuizzesProjects(quizzes.slice(0, 3))
      setLessonPlansProjects(lessonPlans.slice(0, 3))

      setStats({
        totalProjects: count,
        slidesCount: slides.length,
        quizzesCount: quizzes.length,
        lessonPlansCount: lessonPlans.length,
        scriptsCount: scripts.length,
      })
    },
    [fetchProjects]
  )

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guest')
      setUserEmail(user.email || '')
      await loadProjects(user.id, 1, false)
      setLoading(false)
    }
    fetchData()
  }, [])

  // ============================================================
  // CRUD
  // ============================================================
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) {
      toast.error('Project name is required')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { error } = await supabase.from('projects').insert([
        {
          user_id: user.id,
          name: newProjectName.trim(),
          type: newProjectType,
          description: newProjectDesc.trim() || null,
        },
      ])

      if (error) throw error

      toast.success('Project created successfully! 🎉')
      await loadProjects(user.id, 1, false)
      setNewProjectName('')
      setNewProjectType('slides')
      setNewProjectDesc('')
      setModalDirty(false)
      setShowModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project? This action cannot be undone.')) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to delete project')
      return
    }

    toast.success('Project deleted successfully')
    await loadProjects(user.id, 1, false)
  }

  const handleLaunch = (project: Project) => {
    const routes: Record<ProjectType, string> = {
      slides: `/slides/${project.id}`,
      quiz: `/quiz/${project.id}`,
      lesson_plan: `/lesson-planner/${project.id}`,
      script: `/script/${project.id}`,
      other: '#',
    }
    const route = routes[project.type] || '#'
    if (route !== '#') router.push(route)
    else toast.info('This project type is not yet supported')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await loadProjects(user.id, nextPage, true)
      setPage(nextPage)
    }
    setLoadingMore(false)
  }

  const handleModalClose = () => {
    if (modalDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        setShowModal(false)
        setModalDirty(false)
        setNewProjectName('')
        setNewProjectType('slides')
        setNewProjectDesc('')
      }
    } else {
      setShowModal(false)
    }
  }

  // ============================================================
  // SKELETON
  // ============================================================
  if (loading) return <DashboardSkeleton />

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:shadow-sm border-r border-gray-200/50`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200/50">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
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
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-purple-100 mb-3">
                Unlock unlimited projects & advanced AI features.
              </p>
              <button
                onClick={() => toast.info('Upgrade feature coming soon!')}
                className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Zap size={14} /> Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
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
                <h2 className="text-3xl md:text-4xl font-bold">
                  👋 Welcome back, <span className="bg-white/20 px-4 py-1 rounded-full text-2xl">{userName}</span>
                </h2>
                <p className="text-purple-100 mt-2 max-w-xl">
                  Your AI-powered learning hub is ready. Continue your journey with smart tools.
                </p>
                <p className="text-xs text-purple-200/70 mt-1">{userEmail}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Projects', value: stats.totalProjects, icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
              { label: 'Slides', value: stats.slidesCount, icon: FileText, color: 'from-green-500 to-emerald-500' },
              { label: 'Quizzes', value: stats.quizzesCount, icon: HelpCircle, color: 'from-purple-500 to-pink-500' },
              { label: 'Lesson Plans', value: stats.lessonPlansCount, icon: BookOpen, color: 'from-orange-500 to-red-500' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/30 hover:shadow-xl transition-all group">
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
            <QuickAction
              icon={FileText}
              label="New Slides"
              desc="Create presentation"
              color="blue"
              onClick={() => router.push('/slides')}
            />
            <QuickAction
              icon={HelpCircle}
              label="New Quiz"
              desc="Generate quiz"
              color="purple"
              onClick={() => router.push('/quiz')}
            />
            <QuickAction
              icon={BookOpen}
              label="New Lesson Plan"
              desc="Plan your class"
              color="green"
              onClick={() => router.push('/lesson-planner')}
            />
          </div>

          {/* Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <ProjectSection
              title="Recent Slides"
              icon={FileText}
              color="blue"
              projects={slidesProjects}
              emptyIcon="📊"
              emptyText="No slides yet"
              createLink="/slides"
              onLaunch={handleLaunch}
              onDelete={handleDeleteProject}
            />
            <ProjectSection
              title="Recent Quizzes"
              icon={HelpCircle}
              color="purple"
              projects={quizzesProjects}
              emptyIcon="🧠"
              emptyText="No quizzes yet"
              createLink="/quiz"
              onLaunch={handleLaunch}
              onDelete={handleDeleteProject}
            />
            <ProjectSection
              title="Recent Lesson Plans"
              icon={BookOpen}
              color="green"
              projects={lessonPlansProjects}
              emptyIcon="📚"
              emptyText="No lesson plans yet"
              createLink="/lesson-planner"
              onLaunch={handleLaunch}
              onDelete={handleDeleteProject}
            />
          </div>

          {/* Recent Projects */}
          <div className="bg-white/80 rounded-2xl p-6 shadow-sm border border-white/30">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Recent Projects
              </h3>
              <span className="text-xs text-gray-400">Showing {allProjects.length} projects</span>
            </div>

            {allProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚀</div>
                <h4 className="text-xl font-semibold text-gray-700">No projects yet</h4>
                <p className="text-gray-400 text-sm mt-1">Create your first project using the button above.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onLaunch={handleLaunch}
                      onDelete={handleDeleteProject}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={loadMore}
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
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleModalClose}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🚀 Create New Project</h2>
            <p className="text-sm text-gray-400 mb-6">Add a new AI project to your dashboard.</p>
            <form onSubmit={handleAddProject} onChange={() => {
              if (newProjectName.trim() || newProjectDesc.trim()) setModalDirty(true)
              else setModalDirty(false)
            }}>
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
                  onChange={(e) => setNewProjectType(e.target.value as ProjectType)}
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
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
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

      {/* ✅ Chat Widget – Back! */}
      <ChatWidget />
    </div>
  )
}

// ============================================================
// SUB-COMPONENTS (Same as before)
// ============================================================

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: FileText, label: 'AI Slides', href: '/slides/dashboard' },
  { icon: HelpCircle, label: 'AI Quizzes', href: '/quiz/dashboard' },
  { icon: BookOpen, label: 'Lesson Planner', href: '/lesson-planner' },
  { icon: MessageCircle, label: 'AI Chat', href: '/chat' },
  { icon: Library, label: 'My Library', href: '/library' },
  { icon: History, label: 'History', href: '/history' },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: LifeBuoy, label: 'Help & Support', href: '/support' },
]

// --- Quick Action ---
function QuickAction({
  icon: Icon,
  label,
  desc,
  color,
  onClick,
}: {
  icon: React.ElementType
  label: string
  desc: string
  color: 'blue' | 'purple' | 'green'
  onClick: () => void
}) {
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
    <button
      onClick={onClick}
      className={`p-5 rounded-2xl border ${colorMap[color]} hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-4 group`}
    >
      <div className={`p-3 rounded-xl ${iconBg[color]} group-hover:scale-110 transition`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <ArrowRight size={16} className="ml-auto text-gray-400 group-hover:opacity-100 transition opacity-0" />
    </button>
  )
}

// --- Project Section ---
function ProjectSection({
  title,
  icon: Icon,
  color,
  projects,
  emptyIcon,
  emptyText,
  createLink,
  onLaunch,
  onDelete,
}: {
  title: string
  icon: React.ElementType
  color: 'blue' | 'purple' | 'green'
  projects: Project[]
  emptyIcon: string
  emptyText: string
  createLink: string
  onLaunch: (project: Project) => void
  onDelete: (id: string) => void
}) {
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

// --- Project Card ---
function ProjectCard({
  project,
  onLaunch,
  onDelete,
}: {
  project: Project
  onLaunch: (project: Project) => void
  onDelete: (id: string) => void
}) {
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

// --- Dashboard Skeleton ---
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex">
      <div className="hidden lg:block w-72 bg-white/80 border-r border-gray-200/50 p-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-32 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-3xl mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-56 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}