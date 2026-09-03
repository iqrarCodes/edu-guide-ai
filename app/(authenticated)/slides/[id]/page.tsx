'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES } from '@/lib/templates'
import TemplatePreview from '@/components/TemplatePreview'
import ImageUpload from '@/components/ImageUpload'
import {
    ArrowLeft, Sparkles, FileText, Layers, Download, Loader2,
    CheckCircle, Zap, AlertCircle
} from 'lucide-react'

export default function SlidesEditor() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const projectId = params.id

    // ----- State -----
    const [project, setProject] = useState<any>(null)
    const [slidesData, setSlidesData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Form state
    const [topic, setTopic] = useState('')
    const [audience, setAudience] = useState('General')
    const [mode, setMode] = useState('Educational')
    const [style, setStyle] = useState('Educational')
    const [numSlides, setNumSlides] = useState(5)

    // Generation states
    const [generatingOutline, setGeneratingOutline] = useState(false)
    const [generatingSlides, setGeneratingSlides] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [outline, setOutline] = useState<any[] | null>(null)
    const [slides, setSlides] = useState<any[] | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState('modern')
    const [slideImages, setSlideImages] = useState<Record<number, string>>({})

    // ----- Fetch project & slides data -----
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single()

            if (projectError || !projectData) {
                console.error(projectError)
                router.push('/slides')
                return
            }
            setProject(projectData)
            setTopic(projectData.name || '')

            const { data: slidesData, error: slidesError } = await supabase
                .from('slides_data')
                .select('*')
                .eq('project_id', projectId)
                .single()

            if (!slidesError && slidesData) {
                setSlidesData(slidesData)
                if (slidesData.outline) setOutline(slidesData.outline)
                if (slidesData.slides) setSlides(slidesData.slides)
            }
            setLoading(false)
        }
        fetchData()
    }, [projectId, supabase, router])

    // Read template from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const template = params.get('template')
        if (template && TEMPLATES[template]) {
            setSelectedTemplate(template)
        }
    }, [])

    // ----- Render bullet with highlights -----
    const renderBulletWithHighlights = (text: string) => {
        if (!text) return ''
        const parts = text.split(/(\*\*.*?\*\*)/g)
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const keyword = part.slice(2, -2)
                return (
                    <span key={i} className="text-purple-600 font-bold">
                        {keyword}
                    </span>
                )
            }
            return <span key={i}>{part}</span>
        })
    }

    // ----- Generate Outline -----
    const handleGenerateOutline = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic')
            return
        }

        setGeneratingOutline(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/slides/outline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    topic: topic.trim(),
                    audience,
                    mode,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate outline')

            setOutline(data.outline)
            setSuccess('✅ Outline generated successfully!')
            const { data: updatedData } = await supabase
                .from('slides_data')
                .select('*')
                .eq('project_id', projectId)
                .single()
            if (updatedData) setSlidesData(updatedData)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setGeneratingOutline(false)
        }
    }

    // ----- Generate Slides -----
    const handleGenerateSlides = async () => {
        if (!outline || outline.length === 0) {
            setError('Please generate an outline first')
            return
        }

        setGeneratingSlides(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/slides/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    topic: topic.trim(),
                    num_slides: numSlides,
                    style,
                    audience,
                    mode,
                    outline,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate slides')

            setSlides(data.slides)
            setSuccess('✅ Slides generated successfully!')
            const { data: updatedData } = await supabase
                .from('slides_data')
                .select('*')
                .eq('project_id', projectId)
                .single()
            if (updatedData) setSlidesData(updatedData)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setGeneratingSlides(false)
        }
    }

    // ----- Export -----
    const handleExport = async (format: string) => {
        if (!slides || slides.length === 0) {
            setError('No slides to export. Generate slides first.')
            return
        }

        setExporting(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/slides/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slides,
                    projectName: project?.name || 'Presentation',
                    format,
                    templateId: selectedTemplate,
                }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Export failed')
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${project?.name || 'presentation'}.${format}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setSuccess(`✅ ${format.toUpperCase()} exported successfully!`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setExporting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const template = TEMPLATES[selectedTemplate] || TEMPLATES.modern
    const colors = template.colors

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <button
                            onClick={() => router.push('/slides')}
                            className="text-gray-500 hover:text-purple-600 transition flex items-center gap-1 text-sm mb-2"
                        >
                            <ArrowLeft size={16} /> Back to Slides
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="w-8 h-8 text-purple-600" />
                            {project?.name || 'Slides Editor'}
                        </h1>
                        <p className="text-gray-500 text-sm">Generate AI-powered presentations in seconds</p>
                    </div>
                    {slides && (
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => handleExport('pptx')}
                                disabled={exporting}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <Download size={16} /> PPTX
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                disabled={exporting}
                                className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <Download size={16} /> PDF
                            </button>
                            <button
                                onClick={() => handleExport('docx')}
                                disabled={exporting}
                                className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <Download size={16} /> Word
                            </button>
                        </div>
                    )}
                </div>

                {/* Error / Success */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                        <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <span>{success}</span>
                    </div>
                )}

                {/* STEP 1: CONFIGURATION */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-600" />
                        Step 1: Configure Your Presentation
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Artificial Intelligence in Education"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                            <select
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                            >
                                <option>General</option>
                                <option>Students</option>
                                <option>Teachers</option>
                                <option>Researchers</option>
                                <option>Executives</option>
                                <option>Technical Teams</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                            >
                                <option>Educational</option>
                                <option>Business</option>
                                <option>Academic</option>
                                <option>Conference</option>
                                <option>Startup Pitch</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                            <select
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                            >
                                <option>Educational</option>
                                <option>Persuasive</option>
                                <option>Technical</option>
                                <option>Business</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Slides</label>
                            <input
                                type="number"
                                min="3"
                                max="20"
                                value={numSlides}
                                onChange={(e) => setNumSlides(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateOutline}
                        disabled={generatingOutline}
                        className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingOutline ? (
                            <><Loader2 size={18} className="animate-spin" /> Generating Outline...</>
                        ) : (
                            <><Sparkles size={18} /> Generate Outline</>
                        )}
                    </button>
                </div>

                {/* STEP 2: OUTLINE */}
                {outline && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Layers size={20} className="text-blue-600" />
                                Step 2: Outline
                            </h2>
                            <span className="text-xs text-gray-400">{outline.length} sections</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {outline.map((item, idx) => (
                                <div key={idx} className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50">
                                    <p className="font-semibold text-gray-800 text-sm">{idx + 1}. {item.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleGenerateSlides}
                            disabled={generatingSlides}
                            className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generatingSlides ? (
                                <><Loader2 size={18} className="animate-spin" /> Generating Slides...</>
                            ) : (
                                <><Zap size={18} /> Generate Slides</>
                            )}
                        </button>
                    </div>
                )}

                {/* 🎨 TEMPLATE PREVIEW - ALWAYS VISIBLE */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        🎨 Choose Template
                    </h2>
                    <TemplatePreview
                        selected={selectedTemplate}
                        onSelect={setSelectedTemplate}
                        slides={slides || []}
                    />
                </div>

                {/* STEP 3: SLIDES */}
                {slides && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-600" />
                                Step 3: Your Slides ({slides.length})
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {slides.map((slide, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-xl p-5 shadow-sm border transition hover:shadow-md"
                                    style={{
                                        background: colors.bg,
                                        borderColor: colors.accent + '40',
                                    }}
                                >
                                    {/* Image Upload */}
                                    <div className="mb-4">
                                        <ImageUpload
                                            onImageUpload={(file, preview) => {
                                                setSlideImages(prev => ({ ...prev, [idx]: preview }))
                                            }}
                                            currentImage={slideImages[idx]}
                                            onRemove={() => {
                                                setSlideImages(prev => {
                                                    const updated = { ...prev }
                                                    delete updated[idx]
                                                    return updated
                                                })
                                            }}
                                            placeholder="📷 Add image"
                                        />
                                    </div>

                                    {/* Title */}
                                    <div
                                        className="text-lg font-bold mb-3"
                                        style={{ color: colors.title }}
                                    >
                                        {idx + 1}. {slide.title}
                                    </div>

                                    {/* Bullets with justify & highlights */}
                                    <ul className="space-y-2">
                                        {slide.bullets?.map((bullet: string, bi: number) => (
                                            <li
                                                key={bi}
                                                className="text-sm flex items-start gap-2 text-justify"
                                                style={{ color: colors.text }}
                                            >
                                                <span style={{ color: colors.accent }} className="flex-shrink-0">•</span>
                                                <span className="text-justify">{renderBulletWithHighlights(bullet)}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Key Takeaway */}
                                    {slide.key_takeaway && (
                                        <p
                                            className="mt-3 text-xs italic p-2 rounded-lg text-justify"
                                            style={{
                                                background: colors.highlight,
                                                color: colors.text,
                                            }}
                                        >
                                            💡 {slide.key_takeaway}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}