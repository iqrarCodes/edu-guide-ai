'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star, Zap, LogOut, Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import { NavItem } from './types'

interface SidebarProps {
  userName: string
  userEmail: string
  navItems: NavItem[]
  onLogout: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Sidebar({ userName, userEmail, navItems, onLogout, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const router = useRouter()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:shadow-sm border-r border-gray-200/50 flex flex-col`}
    >
      {/* Header */}
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

      {/* Footer – Upgrade + Logout */}
      <div className="p-4 border-t border-gray-200/50 space-y-3">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-sm">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-purple-100 mb-2">Unlock unlimited projects & advanced AI.</p>
          <button
            onClick={() => toast.info('Upgrade feature coming soon!')}
            className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-1.5 rounded-lg transition"
          >
            <Zap size={12} className="inline mr-1" /> Upgrade Now
          </button>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Mobile close button */}
      <button
        onClick={() => setSidebarOpen(false)}
        className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
      >
        <X size={20} />
      </button>
    </aside>
  )
}