'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function BookmarksPage() {
  const supabase = createClient()
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // For demo, we'll treat projects as bookmarks (you can create separate table)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) console.error(error)
      else setBookmarks(data || [])
      setLoading(false)
    }
    fetchBookmarks()
  }, [])

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id))
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <Bookmark className="text-purple-600" /> Bookmarks
      </h1>
      <p className="text-gray-500 mt-1">Your saved projects for quick access.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">No bookmarks yet.</div>
        ) : (
          bookmarks.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-xs text-gray-400 capitalize">{item.type}</p>
                </div>
                <button onClick={() => removeBookmark(item.id)} className="text-gray-400 hover:text-red-500 transition">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <Link href={`/${item.type}/${item.id}`} className="mt-3 inline-block text-purple-600 text-sm font-medium hover:underline">
                Open →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}