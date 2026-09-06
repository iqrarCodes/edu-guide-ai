'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Activity, Calendar } from 'lucide-react'

export default function HistoryPage() {
  const supabase = createClient()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // For demo, we'll simulate history from projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) console.error(error)
      else setHistory(data || [])
      setLoading(false)
    }
    fetchHistory()
  }, [])

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <Clock className="text-purple-600" /> Activity History
      </h1>
      <p className="text-gray-500 mt-1">Your recent actions and project updates.</p>

      <div className="mt-8 space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No activity yet.</div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Activity size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  Created <span className="text-purple-600">{item.name}</span>
                </p>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Calendar size={14} /> {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                {item.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}