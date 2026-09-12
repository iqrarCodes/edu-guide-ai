'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, LayoutTemplate, Download, FileText, Layers,
  Star, Sparkles, Clock, ArrowRight, Eye, X, CheckCircle
} from 'lucide-react'
import { SLIDE_TEMPLATES, TemplateId } from '@/lib/slide-templates'

export default function SlidesDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [presentations, setPresentations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Guest')
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null)

  // ✅ Templates hidden by default
  const [showTemplates, setShowTemplates] = useState(false)

  const totalPresentations = presentations.length
  const totalSlides = presentations.reduce(
    (acc, p) => acc + (p.slides_data?.[0]?.slides?.length || 0), 0
  )
  const recentPresentations = presentations.slice(0, 4)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guest')
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
                    id, name, created_at, updated_at,
                    slides_data (id, slides, status, template_id)
                `)
        .eq('type', 'slides')
        .order('updated_at', { ascending: false })

      if (!error && data) setPresentations(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleLoadPresentation = (id: string) => router.push(`/slides/${id}`)

  const handleCreateWithTemplate = (templateId: string) => {
    setPreviewTemplate(null)
    router.push(`/slides?template=${templateId}`)
  }

  // ✅ Toggle templates visibility
  const handleToggleTemplates = () => {
    setShowTemplates(prev => !prev)
  }

  const quickActions = [
    {
      icon: <Plus size={20} />,
      label: 'New Presentation',
      action: () => router.push('/slides'),
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: <LayoutTemplate size={20} />,
      label: showTemplates ? 'Hide Templates' : 'Browse Templates',
      action: handleToggleTemplates,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Download size={20} />,
      label: 'Export All',
      action: () => alert('📦 Export all as ZIP coming soon!'),
      color: 'from-green-500 to-emerald-500',
    },
  ]

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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" /> Slides Dashboard
            </h1>
            <p className="text-gray-500 text-sm">Manage all your AI-generated presentations</p>
          </div>
          <button
            onClick={() => router.push('/slides')}
            className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2"
          >
            <Plus size={18} /> New Presentation
          </button>
        </div>

        {/* Welcome */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome back, <span className="text-purple-600">{userName}</span>! 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">Here's an overview of your presentations.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Presentations', value: totalPresentations, icon: FileText, color: 'from-blue-500 to-cyan-500', delay: 0 },
            { label: 'Total Slides', value: totalSlides, icon: Layers, color: 'from-purple-500 to-pink-500', delay: 0.1 },
            { label: 'Avg Rating', value: '4.9', icon: Star, color: 'from-yellow-500 to-orange-500', delay: 0.2 },
            { label: 'Templates', value: Object.keys(SLIDE_TEMPLATES).length, icon: LayoutTemplate, color: 'from-green-500 to-emerald-500', delay: 0.3 },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/30 hover:shadow-xl transition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: stat.delay }}
            >
              <div className={`bg-gradient-to-r ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => (
              <motion.button
                key={idx}
                onClick={action.action}
                className={`bg-gradient-to-r ${action.color} text-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition flex items-center gap-3 group`}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <div className="bg-white/20 p-2 rounded-xl">{action.icon}</div>
                <span className="font-medium">{action.label}</span>
                <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* ===== 🎨 TEMPLATES GALLERY (Toggle) ===== */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              id="templates-section"
              className="mb-8"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">🎨 Available Templates</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Click "Preview" to see the design, or "Use" to create a presentation.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                    title="Close templates"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.values(SLIDE_TEMPLATES).map((template) => {
                    const c = template.styles.colors
                    const s = template.styles
                    return (
                      <motion.div
                        key={template.id}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-white/30 hover:shadow-xl transition cursor-pointer hover:-translate-y-1 group"
                        whileHover={{ y: -6 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * (Object.values(SLIDE_TEMPLATES).indexOf(template) + 1) }}
                      >
                        {/* Mini Preview */}
                        <div
                          className="relative h-20 rounded-xl overflow-hidden mb-3"
                          style={{ backgroundColor: `#${c.bg}` }}
                        >
                          {s.titleSlide.decoration === 'bar' && (
                            <div className="absolute top-0 left-0 right-0 h-6" style={{ backgroundColor: `#${c.accent}` }} />
                          )}
                          {s.titleSlide.decoration === 'circle' && (
                            <>
                              <div className="absolute -top-1 -left-1 w-8 h-8 rounded-full" style={{ backgroundColor: `#${c.accent}`, opacity: 0.4 }} />
                              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full" style={{ backgroundColor: `#${c.secondary}`, opacity: 0.4 }} />
                            </>
                          )}
                          {s.titleSlide.decoration === 'block' && (
                            <div className="absolute inset-2 rounded" style={{ backgroundColor: `#${c.accent}` }} />
                          )}
                          {s.contentSlide.accentPosition === 'left' && (
                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: `#${c.accent}` }} />
                          )}
                          {s.contentSlide.accentPosition === 'sidebar' && (
                            <div className="absolute left-0 top-0 bottom-0 w-6" style={{ backgroundColor: `#${c.accent}` }} />
                          )}
                          {s.contentSlide.accentPosition === 'top' && (
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: `#${c.accent}` }} />
                          )}
                          <div className="absolute bottom-1.5 left-2 right-2">
                            <p className="text-[10px] font-bold truncate" style={{ color: `#${c.text}` }}>
                              {template.icon} {template.name}
                            </p>
                            <div className="h-0.5 w-6 mt-0.5 rounded-full" style={{ backgroundColor: `#${c.accent}` }} />
                          </div>
                        </div>

                        <p className="font-semibold text-gray-800 text-xs truncate">{template.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 text-[10px] font-medium py-1.5 rounded-xl transition flex items-center justify-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewTemplate(template)
                            }}
                          >
                            <Eye size={10} /> Preview
                          </button>
                          <button
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-medium py-1.5 rounded-xl transition"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCreateWithTemplate(template.id)
                            }}
                          >
                            Use
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Presentations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock size={18} className="text-purple-500" /> Recent Presentations
            </h3>
            {presentations.length > 4 && (
              <button
                onClick={() => router.push('/slides')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View All
              </button>
            )}
          </div>

          {presentations.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-xl font-medium text-gray-500">No presentations yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first AI-powered presentation</p>
              <button
                onClick={() => router.push('/slides')}
                className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition"
              >
                + New Presentation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentPresentations.map((pres, idx) => {
                const slideCount = pres.slides_data?.[0]?.slides?.length || 0
                const templateId = pres.slides_data?.[0]?.template_id || 'modern'
                const template = SLIDE_TEMPLATES[templateId as TemplateId] || SLIDE_TEMPLATES.modern
                return (
                  <motion.div
                    key={pres.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/30 hover:shadow-xl transition cursor-pointer"
                    whileHover={{ y: -6 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    onClick={() => handleLoadPresentation(pres.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800 truncate">{pres.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">{slideCount} slides</p>
                      </div>
                      <span className="text-2xl">{template.icon}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-400">
                        {new Date(pres.updated_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLoadPresentation(pres.id) }}
                        className="text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-1.5 rounded-xl font-medium transition"
                      >
                        Open
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== TEMPLATE PREVIEW MODAL ===== */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{previewTemplate.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{previewTemplate.name}</h2>
                    <p className="text-sm text-gray-400">{previewTemplate.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div
                  className="rounded-2xl shadow-lg border relative aspect-video overflow-hidden"
                  style={{ backgroundColor: `#${previewTemplate.styles.colors.bg}` }}
                >
                  {previewTemplate.styles.titleSlide.decoration === 'bar' && (
                    <div className="absolute top-0 left-0 right-0 h-1/3" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                  )}
                  {previewTemplate.styles.titleSlide.decoration === 'circle' && (
                    <>
                      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}`, opacity: 0.3 }} />
                      <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full" style={{ backgroundColor: `#${previewTemplate.styles.colors.secondary}`, opacity: 0.3 }} />
                    </>
                  )}
                  {previewTemplate.styles.titleSlide.decoration === 'block' && (
                    <div className="absolute inset-8 rounded-xl" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                  )}
                  {previewTemplate.styles.contentSlide.accentPosition === 'left' && (
                    <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                  )}
                  {previewTemplate.styles.contentSlide.accentPosition === 'sidebar' && (
                    <div className="absolute left-0 top-0 bottom-0 w-24" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                  )}
                  {previewTemplate.styles.contentSlide.accentPosition === 'top' && (
                    <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                  )}

                  <div className={`relative h-full flex flex-col ${previewTemplate.styles.contentSlide.accentPosition === 'sidebar' ? 'ml-28 p-6' : 'p-8'}`}>
                    <h3 className="text-3xl font-bold mb-2" style={{ color: `#${previewTemplate.styles.colors.text}` }}>
                      {previewTemplate.name} Template
                    </h3>
                    <div className="w-16 h-1 rounded-full mb-6" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                    <ul className="space-y-2 text-base flex-1" style={{ color: `#${previewTemplate.styles.colors.text}` }}>
                      <li className="flex items-center gap-2">
                        <span style={{ color: `#${previewTemplate.styles.colors.accent}` }}>▸</span>
                        Layout: {previewTemplate.layout}
                      </li>
                      <li className="flex items-center gap-2">
                        <span style={{ color: `#${previewTemplate.styles.colors.accent}` }}>▸</span>
                        Unique multi-color design
                      </li>
                      <li className="flex items-center gap-2">
                        <span style={{ color: `#${previewTemplate.styles.colors.accent}` }}>▸</span>
                        Shapes, banners, and decorations
                      </li>
                    </ul>
                    <div
                      className="p-3 rounded-xl mt-4"
                      style={{
                        backgroundColor: `#${previewTemplate.styles.colors.accent}15`,
                        borderLeft: `3px solid #${previewTemplate.styles.colors.accent}`,
                      }}
                    >
                      <p className="text-sm italic" style={{ color: `#${previewTemplate.styles.colors.text}` }}>
                        💡 Key takeaway appears here
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCreateWithTemplate(previewTemplate.id)
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Use "{previewTemplate.name}"
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}