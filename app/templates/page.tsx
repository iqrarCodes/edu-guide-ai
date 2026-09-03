'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES } from '@/lib/templates'
import { ArrowLeft, Sparkles, Plus, Check, X, Eye } from 'lucide-react'
import TemplatePreview from '@/components/TemplatePreview'

export default function TemplatesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handlePreview = (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowPreview(true)
  }

  const handleUseTemplate = async (templateId: string) => {
    setLoading(templateId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const template = TEMPLATES[templateId]
      const projectName = `${template.name} Presentation`

      const { data: project, error } = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          type: 'slides',
          name: projectName,
          description: `Template: ${template.name}`,
        }])
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('slides_data')
        .insert([{
          project_id: project.id,
          template_id: templateId,
          status: 'draft',
        }])

      setShowPreview(false)
      router.push(`/slides/${project.id}?template=${templateId}`)
    } catch (error) {
      console.error('Error creating project from template:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-purple-600 transition flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Browse Templates
          </h1>
        </div>

        <p className="text-gray-500 text-sm mb-8">
          Click on any template to preview it, then use it to start your presentation.
        </p>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(TEMPLATES).map(([id, template]) => (
            <div
              key={id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 hover:shadow-xl transition-all hover:-translate-y-1 group cursor-pointer"
              onClick={() => handlePreview(id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{template.icon}</div>
                <span className="text-xs text-gray-400 capitalize">{id}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>

              {/* Preview colors */}
              <div className="flex gap-2 mt-4">
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ background: template.colors.accent }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ background: template.colors.bg }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ background: template.colors.title }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ background: template.colors.text }}
                />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview(id)
                }}
                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Eye size={16} /> Preview & Use
              </button>
            </div>
          ))}
        </div>

        {/* Back button at bottom */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/slides/dashboard')}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mx-auto"
          >
            ← Back to Slides Dashboard
          </button>
        </div>
      </div>

      {/* ===== PREVIEW MODAL ===== */}
      {showPreview && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{TEMPLATES[selectedTemplate]?.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {TEMPLATES[selectedTemplate]?.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {TEMPLATES[selectedTemplate]?.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Template Preview */}
            <div className="mb-6">
              <TemplatePreview
                selected={selectedTemplate}
                onSelect={() => {}}
                slides={[]}
              />
            </div>

            {/* Color Palette */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-700">Color Palette:</span>
              <div className="flex gap-2">
                {Object.entries(TEMPLATES[selectedTemplate]?.colors || {}).map(([key, color]) => (
                  <div
                    key={key}
                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                    style={{ background: color as string }}
                    title={key}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUseTemplate(selectedTemplate)}
                disabled={loading === selectedTemplate}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading === selectedTemplate ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Use This Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}