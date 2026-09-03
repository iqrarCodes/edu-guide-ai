'use client'

import { TEMPLATES } from '@/lib/templates'
import { useState } from 'react'

interface TemplatePreviewProps {
  selected: string
  onSelect: (id: string) => void
  slides?: any[]
}

export default function TemplatePreview({ selected, onSelect, slides = [] }: TemplatePreviewProps) {
  const [previewSlide, setPreviewSlide] = useState(0)

  const sampleSlide = {
    title: 'Sample Presentation Title',
    bullets: [
      'Key **point one** with highlighted words',
      'Important **metric** showing growth',
      'Visual **elements** enhance understanding',
    ],
    key_takeaway: 'This is a sample takeaway message.',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {Object.entries(TEMPLATES).map(([id, template]) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`relative p-4 rounded-2xl border-2 transition-all text-left w-32 ${
              selected === id
                ? 'border-purple-600 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{ background: template.colors.bg }}
          >
            <div className="text-2xl mb-1">{template.icon}</div>
            <div className="text-xs font-bold" style={{ color: template.colors.title }}>
              {template.name}
            </div>
            <div className="text-[10px] opacity-60" style={{ color: template.colors.text }}>
              {template.description.split(',')[0]}
            </div>
            {selected === id && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 text-xs text-gray-500">
          <span>Preview</span>
          <div className="flex gap-2">
            {slides.length > 0 && (
              <button
                onClick={() => setPreviewSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
                className="px-2 py-1 bg-white rounded hover:bg-gray-200"
              >
                ◀
              </button>
            )}
            <span>{slides.length > 0 ? `${previewSlide + 1}/${slides.length}` : 'Sample'}</span>
            {slides.length > 0 && (
              <button
                onClick={() => setPreviewSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0))}
                className="px-2 py-1 bg-white rounded hover:bg-gray-200"
              >
                ▶
              </button>
            )}
          </div>
        </div>
        <div
          className="p-6 min-h-[250px] relative"
          style={{ background: TEMPLATES[selected]?.colors.bg }}
        >
          <SlidePreview
            slide={slides.length > 0 ? slides[previewSlide] : sampleSlide}
            template={TEMPLATES[selected]}
            index={previewSlide}
          />
        </div>
      </div>
    </div>
  )
}

function SlidePreview({ slide, template, index }: any) {
  const colors = template.colors
  const layout = template.layouts.content

  return (
    <div className="relative h-full">
      {layout.showShapes && layout.shapeType === 'rect' && (
        <div
          className="absolute left-0 top-0 w-1.5 h-full"
          style={{ background: colors.accent }}
        />
      )}
      {layout.showShapes && layout.shapeType === 'circle' && (
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20"
          style={{ background: colors.accent }}
        />
      )}
      {layout.showShapes && layout.shapeType === 'curve' && (
        <div
          className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-10"
          style={{ background: colors.accent }}
        />
      )}

      <div className="relative z-10">
        <div
          className={`text-lg font-bold mb-3 ${
            layout.titlePosition === 'center' ? 'text-center' : 'text-left'
          }`}
          style={{ color: colors.title }}
        >
          {slide.title || `Slide ${index + 1}`}
        </div>

        <ul className="space-y-1.5">
          {(slide.bullets || ['Bullet point 1', 'Bullet point 2']).slice(0, 3).map((b: string, i: number) => {
            const parts = b.split(/(\*\*.*?\*\*)/g)
            return (
              <li key={i} className="text-xs flex items-start gap-1.5 text-justify" style={{ color: colors.text }}>
                <span style={{ color: colors.accent }} className="flex-shrink-0">•</span>
                <span className="text-justify">
                  {parts.map((part: string, pi: number) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <span key={pi} className="font-bold" style={{ color: colors.accent }}>
                          {part.slice(2, -2)}
                        </span>
                      )
                    }
                    return <span key={pi}>{part}</span>
                  })}
                </span>
              </li>
            )
          })}
        </ul>

        {layout.showDivider && (
          <div className="my-3 h-px w-16" style={{ background: colors.accent }} />
        )}

        {slide.key_takeaway && (
          <p className="text-xs italic opacity-80 text-justify" style={{ color: colors.text }}>
            💡 {slide.key_takeaway}
          </p>
        )}
      </div>
    </div>
  )
}