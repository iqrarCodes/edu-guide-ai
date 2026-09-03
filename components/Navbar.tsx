'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, LayoutDashboard, LogOut } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { toast } from 'sonner'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()   // ✅ Current page path
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  // ✅ Check if we are on dashboard
  const isDashboard = pathname === '/dashboard'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo always visible – click goes to dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition"
          >
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            EduGuide AI+
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* ✅ Dashboard Link – hide when on dashboard */}
            {!isDashboard && (
              <Link
                href="/dashboard"
                className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}