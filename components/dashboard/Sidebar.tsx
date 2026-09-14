'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, HelpCircle, BookOpen,
  Library, History, Bookmark, Settings, LifeBuoy,
  MessageCircle, Menu, X, LogOut, Star, Zap
} from 'lucide-react'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'AI Slides', href: '/slides/dashboard' },
  { icon: HelpCircle, label: 'AI Quizzes', href: '/quiz/dashboard' },
  { icon: BookOpen, label: 'Lesson Planner', href: '/lesson-planner/dashboard' },
  { icon: MessageCircle, label: 'AI Chat', href: '/chat' },
  { icon: Library, label: 'My Library', href: '/library' },
  { icon: History, label: 'History', href: '/history' },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: LifeBuoy, label: 'Help & Support', href: '/support' },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [userName, setUserName] = useState('Guest')
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guest')
        setUserEmail(user.email || '')
      }
    }
    fetchUser()
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200"
        aria-label="Open sidebar"
      >
        <Menu size={22} className="text-purple-600" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 lg:translate-x-0 lg:static lg:shadow-sm border-r border-gray-200/50 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Close button (mobile) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        {/* User profile */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item, idx) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href.replace('/dashboard', '')))

            return (
              <Link
                key={idx}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100/70 hover:text-purple-600'
                  }`}
              >
                <item.icon size={18} />
                {item.label}
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-purple-500" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 space-y-3">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-sm">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-purple-100 mb-2">Unlock unlimited projects & advanced AI.</p>
            <button
              onClick={() => toast.info('Upgrade coming soon!')}
              className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-1.5 rounded-lg transition"
            >
              <Zap size={12} className="inline mr-1" /> Upgrade Now
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}