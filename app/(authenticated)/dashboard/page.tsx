'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LayoutDashboard, FileText, HelpCircle, BookOpen,
  Library, History, Bookmark, Settings, LifeBuoy,
  MessageCircle, Menu,    
  Plus,     

} from 'lucide-react'

import { Project, ProjectType, NavItem } from '@/components/dashboard/types'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ProjectSection } from '@/components/dashboard/ProjectSection'
import { RecentProjects } from '@/components/dashboard/RecentProjects'
import { AddProjectModal } from '@/components/dashboard/AddProjectModal'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import ChatWidget from '@/components/ChatWidget'

// ============================================================
// NAV ITEMS
// ============================================================
const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true, href: '/dashboard' },
  { icon: FileText, label: 'AI Slides', active: false, href: '/slides' },
  { icon: HelpCircle, label: 'AI Quizzes', active: false, href: '/quiz' },
  { icon: BookOpen, label: 'Lesson Planner', active: false, href: '/lesson-planner' },
  { icon: MessageCircle, label: 'AI Chat', active: false, href: '/chat' },
  { icon: Library, label: 'My Library', active: false, href: '/library' },
  { icon: History, label: 'History', active: false, href: '/history' },
  { icon: Bookmark, label: 'Bookmarks', active: false, href: '/bookmarks' },
  { icon: Settings, label: 'Settings', active: false, href: '/settings' },
  { icon: LifeBuoy, label: 'Help & Support', active: false, href: '/support' },
]

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
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        navItems={navItems}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-200/50 p-4 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-bold text-purple-600">EduGuide AI+</h1>
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Welcome Banner (Email removed) */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  👋 Welcome back, <span className="bg-white/20 px-4 py-1 rounded-full text-2xl">{userName}</span>
                </h2>
                <p className="text-purple-100 mt-2 max-w-xl">
                  Your AI-powered learning hub is ready. Continue your journey with smart tools.
                </p>
                {/* Email removed from here - now in sidebar */}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-white text-purple-700 px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2 hover:scale-105"
                >
                  <Plus size={20} /> New Project
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <StatsGrid stats={stats} />

          {/* Quick Actions */}
          <QuickActions
            actions={[
              { icon: FileText, label: 'New Slides', desc: 'Create presentation', color: 'blue', onClick: () => router.push('/slides') },
              { icon: HelpCircle, label: 'New Quiz', desc: 'Generate quiz', color: 'purple', onClick: () => router.push('/quiz') },
              { icon: BookOpen, label: 'New Lesson Plan', desc: 'Plan your class', color: 'green', onClick: () => router.push('/lesson-planner') },
            ]}
          />

          {/* Project Sections */}
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
          <RecentProjects
            projects={allProjects}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onLaunch={handleLaunch}
            onDelete={handleDeleteProject}
          />
        </div>
      </main>

      {/* Add Project Modal */}
      <AddProjectModal
        show={showModal}
        onClose={handleModalClose}
        onSubmit={handleAddProject}
        projectName={newProjectName}
        setProjectName={setNewProjectName}
        projectType={newProjectType}
        setProjectType={setNewProjectType}
        projectDesc={newProjectDesc}
        setProjectDesc={setNewProjectDesc}
        submitting={submitting}
        setModalDirty={setModalDirty}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}