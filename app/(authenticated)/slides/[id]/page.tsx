'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SLIDE_TEMPLATES, TemplateId } from '@/lib/slide-templates'
import ImageUpload from '@/components/ImageUpload'
import {
    ArrowLeft, Sparkles, FileText, Layers, Download, Loader2,
    CheckCircle, Zap, AlertCircle, Eye, X, Plus, Trash2
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
    const [numSlides, setNumSlides] = useState(6)

    // Generation states
    const [generatingOutline, setGeneratingOutline] = useState(false)
    const [generatingSlides, setGeneratingSlides] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [outline, setOutline] = useState<any[] | null>(null)
    const [slides, setSlides] = useState<any[] | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern')
    const [slideImages, setSlideImages] = useState<Record<number, string>>({})
    const [previewTemplate, setPreviewTemplate] = useState<any | null>(null)

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
                if (slidesData.template_id) {
                    setSelectedTemplate(slidesData.template_id as TemplateId)
                }
            }
            setLoading(false)
        }
        fetchData()
    }, [projectId, supabase, router])

    // ----- Read template from URL (?template=xxx) -----
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const template = urlParams.get('template')
        if (template && SLIDE_TEMPLATES[template as TemplateId]) {
            setSelectedTemplate(template as TemplateId)
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

    // ============================================================
    // OUTLINE EDITING FUNCTIONS
    // ============================================================
    const handleOutlineChange = (idx: number, field: 'title' | 'description', value: string) => {
        if (!outline) return
        const newOutline = [...outline]
        newOutline[idx] = { ...newOutline[idx], [field]: value }
        setOutline(newOutline)
    }

    const handleAddSection = () => {
        if (!outline) return
        setOutline([
            ...outline,
            { title: 'New Section Title', description: 'Describe what this section will cover in detail...' }
        ])
    }

    const handleRemoveSection = (idx: number) => {
        if (!outline) return
        if (outline.length <= 1) {
            setError('At least one section is required')
            return
        }
        setOutline(outline.filter((_, i) => i !== idx))
    }

    const handleMoveUp = (idx: number) => {
        if (!outline || idx === 0) return
        const newOutline = [...outline]
            ;[newOutline[idx - 1], newOutline[idx]] = [newOutline[idx], newOutline[idx - 1]]
        setOutline(newOutline)
    }

    const handleMoveDown = (idx: number) => {
        if (!outline || idx === outline.length - 1) return
        const newOutline = [...outline]
            ;[newOutline[idx], newOutline[idx + 1]] = [newOutline[idx + 1], newOutline[idx]]
        setOutline(newOutline)
    }

    // ----- Save Outline to DB -----
    const saveOutlineToDB = async (newOutline: any[]) => {
        try {
            await supabase
                .from('slides_data')
                .update({ outline: newOutline })
                .eq('project_id', projectId)
        } catch (e) {
            console.error('Failed to save outline:', e)
        }
    }

    // ============================================================
    // Generate Outline (using dedicated OUTLINE API key)
    // ============================================================
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
                    numSections: numSlides,   // ✅ Sections = slides count
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate outline')

            setOutline(data.outline)
            setSuccess(` Unique outline generated (${data.outline.length} sections). You can edit it below.`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setGeneratingOutline(false)
        }
    }

    // ============================================================
    // Generate Slides (from EDITED outline)
    // ============================================================
    const handleGenerateSlides = async () => {
        if (!outline || outline.length === 0) {
            setError('Please generate an outline first')
            return
        }

        // Validate outline
        const emptySections = outline.filter(o => !o.title.trim())
        if (emptySections.length > 0) {
            setError('Please fill in all section titles')
            return
        }

        // Save current outline to DB before generating slides
        await saveOutlineToDB(outline)

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
                    outline: outline,   // ✅ Send edited outline
                    audience,
                    mode,
                    style,
                    templateId: selectedTemplate,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate slides')

            setSlides(data.slides)
            setSuccess(` ${data.slides.length} slides generated matching your outline!`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setGeneratingSlides(false)
        }
    }

    // ----- Export -----
    const handleExport = async () => {
        if (!slides || slides.length === 0) {
            setError('No slides to export. Generate slides first.')
            return
        }

        setExporting(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/slides/export-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: selectedTemplate,
                    slides: slides.map((s: any, idx: number) => ({
                        type: s.type || 'content',
                        title: s.title,
                        bullets: s.bullets || [],
                        steps: s.steps || [],
                        stats: s.stats || [],
                        chartType: s.chartType || 'bar',
                        chartData: s.chartData || [],
                        leftTitle: s.leftTitle || '',
                        leftItems: s.leftItems || [],
                        rightTitle: s.rightTitle || '',
                        rightItems: s.rightItems || [],
                        quote: s.quote || '',
                        author: s.author || '',
                        items: s.items || [],
                        key_takeaway: s.key_takeaway || '',
                        image: slideImages[idx] || null,
                    })),
                    title: project?.name || 'Presentation',
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Export failed')
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${project?.name || 'presentation'}.pptx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setSuccess(' Presentation exported successfully!')
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

    const template = SLIDE_TEMPLATES[selectedTemplate] || SLIDE_TEMPLATES.modern
    const colors = template.styles.colors

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* ===== HEADER ===== */}
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
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 disabled:opacity-50 text-sm"
                        >
                            <Download size={16} />
                            {exporting ? 'Exporting...' : 'Download PPTX'}
                        </button>
                    )}
                </div>

                {/* ===== Error / Success ===== */}
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

                {/* ===== STEP 1: CONFIGURATION ===== */}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Sections/Slides</label>
                            <input
                                type="number"
                                min="3"
                                max="20"
                                value={numSlides}
                                onChange={(e) => setNumSlides(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            />
                            <p className="text-xs text-gray-400 mt-1">AI will create this many outline sections</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateOutline}
                        disabled={generatingOutline}
                        className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {generatingOutline ? (
                            <><Loader2 size={18} className="animate-spin" /> Generating Unique Outline...</>
                        ) : (
                            <><Sparkles size={18} /> Generate Outline</>
                        )}
                    </button>
                </div>

                {/* ===== STEP 2: EDITABLE OUTLINE ===== */}
                {outline && outline.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Layers size={20} className="text-blue-600" />
                                    Step 2: Edit Your Outline
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Edit titles, descriptions, add/remove/move sections. Slides will match this outline exactly.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                    {outline.length} sections
                                </span>
                                <button
                                    onClick={handleAddSection}
                                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {outline.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 hover:border-blue-300 transition"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Section number */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold mt-1">
                                            {idx + 1}
                                        </div>

                                        {/* Editable fields */}
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => handleOutlineChange(idx, 'title', e.target.value)}
                                                placeholder="Section title"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                            />
                                            <textarea
                                                value={item.description}
                                                onChange={(e) => handleOutlineChange(idx, 'description', e.target.value)}
                                                placeholder="Describe what this section will cover..."
                                                rows={2}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
                                            />
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => handleMoveUp(idx)}
                                                disabled={idx === 0}
                                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                                title="Move up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(idx)}
                                                disabled={idx === outline.length - 1}
                                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                                title="Move down"
                                            >
                                                ▼
                                            </button>
                                            <button
                                                onClick={() => handleRemoveSection(idx)}
                                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"
                                                title="Remove section"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleGenerateSlides}
                            disabled={generatingSlides || outline.length === 0}
                            className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-2xl font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {generatingSlides ? (
                                <><Loader2 size={18} className="animate-spin" /> Generating {outline.length} Slides...</>
                            ) : (
                                <><Zap size={18} /> Generate {outline.length} Slides from Outline</>
                            )}
                        </button>
                    </div>
                )}

                {/* ===== STEP 3: CHOOSE TEMPLATE (16 TEMPLATES) ===== */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        🎨 Step 3: Choose Template
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.values(SLIDE_TEMPLATES).map((tpl) => {
                            const c = tpl.styles.colors
                            const s = tpl.styles
                            const isSelected = selectedTemplate === tpl.id
                            return (
                                <div
                                    key={tpl.id}
                                    className={`rounded-2xl p-3 border-2 transition cursor-pointer hover:shadow-lg ${isSelected
                                            ? 'border-purple-600 bg-purple-50 shadow-md'
                                            : 'border-gray-200 hover:border-purple-300 bg-white'
                                        }`}
                                    onClick={() => setSelectedTemplate(tpl.id)}
                                >
                                    <div
                                        className="relative h-20 rounded-xl overflow-hidden mb-2"
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
                                        {s.contentSlide.accentPosition === 'left' && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: `#${c.accent}` }} />
                                        )}
                                        {s.contentSlide.accentPosition === 'top' && (
                                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: `#${c.accent}` }} />
                                        )}
                                        <div className="absolute bottom-1.5 left-2 right-2">
                                            <p className="text-[10px] font-bold truncate" style={{ color: `#${c.text}` }}>
                                                {tpl.icon} {tpl.name}
                                            </p>
                                            <div className="h-0.5 w-6 mt-0.5 rounded-full" style={{ backgroundColor: `#${c.accent}` }} />
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                                                <CheckCircle size={12} className="text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <p className="font-semibold text-gray-800 text-xs truncate">{tpl.name}</p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setPreviewTemplate(tpl)
                                        }}
                                        className="mt-1 w-full text-[10px] text-purple-600 hover:text-purple-800 font-medium flex items-center justify-center gap-1"
                                    >
                                        <Eye size={10} /> Preview
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ===== STEP 4: SLIDES ===== */}
                {slides && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-600" />
                                Step 4: Your Slides ({slides.length})
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
                                            placeholder="📷 Add image (optional)"
                                        />
                                    </div>

                                    {/* Slide Type Badge */}
                                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-2 uppercase tracking-wide">
                                        {slide.type || 'content'}
                                    </span>

                                    <div className="text-lg font-bold mb-3" style={{ color: colors.text }}>
                                        {idx + 1}. {slide.title}
                                    </div>

                                    {/* Content preview based on type */}
                                    {slide.bullets && slide.bullets.length > 0 && (
                                        <ul className="space-y-2">
                                            {slide.bullets.map((bullet: string, bi: number) => (
                                                <li
                                                    key={bi}
                                                    className="text-sm flex items-start gap-2 text-justify"
                                                    style={{ color: colors.text }}
                                                >
                                                    <span style={{ color: colors.accent }} className="flex-shrink-0">▸</span>
                                                    <span className="text-justify">{renderBulletWithHighlights(bullet)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {slide.steps && slide.steps.length > 0 && (
                                        <ol className="space-y-1 text-sm list-decimal list-inside" style={{ color: colors.text }}>
                                            {slide.steps.map((step: string, si: number) => (
                                                <li key={si}>{step}</li>
                                            ))}
                                        </ol>
                                    )}

                                    {slide.stats && slide.stats.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {slide.stats.map((s: any, si: number) => (
                                                <div key={si} className="text-center p-2 rounded-lg bg-white/50">
                                                    <div className="text-lg font-bold" style={{ color: colors.accent }}>{s.value}</div>
                                                    <div className="text-xs" style={{ color: colors.text }}>{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {slide.items && slide.items.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {slide.items.map((it: any, ii: number) => (
                                                <div key={ii} className="text-sm" style={{ color: colors.text }}>
                                                    {it.icon} {it.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {slide.quote && (
                                        <blockquote className="italic text-sm border-l-2 pl-3" style={{ borderColor: colors.accent, color: colors.text }}>
                                            "{slide.quote}"
                                            {slide.author && <footer className="text-xs mt-1">— {slide.author}</footer>}
                                        </blockquote>
                                    )}

                                    {(slide.leftItems?.length > 0 || slide.rightItems?.length > 0) && (
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <div className="font-bold mb-1" style={{ color: colors.accent }}>{slide.leftTitle}</div>
                                                <ul className="space-y-1" style={{ color: colors.text }}>
                                                    {slide.leftItems?.map((li: string, lii: number) => <li key={lii}>• {li}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <div className="font-bold mb-1" style={{ color: colors.accent }}>{slide.rightTitle}</div>
                                                <ul className="space-y-1" style={{ color: colors.text }}>
                                                    {slide.rightItems?.map((ri: string, rii: number) => <li key={rii}>• {ri}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {slide.key_takeaway && (
                                        <p
                                            className="mt-3 text-xs italic p-2 rounded-lg text-justify"
                                            style={{
                                                background: `#${colors.accent}15`,
                                                color: colors.text,
                                                borderLeft: `3px solid #${colors.accent}`,
                                            }}
                                        >
                                            {slide.key_takeaway}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ===== TEMPLATE PREVIEW MODAL ===== */}
            {previewTemplate && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
                    onClick={() => setPreviewTemplate(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
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
                                {previewTemplate.styles.contentSlide.accentPosition === 'left' && (
                                    <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                                )}
                                {previewTemplate.styles.contentSlide.accentPosition === 'top' && (
                                    <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                                )}

                                <div className="p-8 relative h-full flex flex-col">
                                    <h3 className="text-3xl font-bold mb-2" style={{ color: `#${previewTemplate.styles.colors.text}` }}>
                                        Sample Presentation Title
                                    </h3>
                                    <div className="w-16 h-1 rounded-full mb-6" style={{ backgroundColor: `#${previewTemplate.styles.colors.accent}` }} />
                                    <ul className="space-y-2 text-base flex-1" style={{ color: `#${previewTemplate.styles.colors.text}` }}>
                                        <li className="flex items-center gap-2">
                                            <span style={{ color: `#${previewTemplate.styles.colors.accent}` }}>▸</span>
                                            Multi-color design with shapes
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span style={{ color: `#${previewTemplate.styles.colors.accent}` }}>▸</span>
                                            Custom colors, banners, and decorations
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span style={{ color: `#${previewTemplate.styles.colors.accent}` }}>▸</span>
                                            Add images to make it visual
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
                                            Key takeaway appears here
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
                                        setSelectedTemplate(previewTemplate.id)
                                        setPreviewTemplate(null)
                                    }}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> Use "{previewTemplate.name}"
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}