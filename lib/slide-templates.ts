// lib/slide-templates.ts

export type TemplateId =
    | 'modern' | 'corporate' | 'creative' | 'academic'
    | 'thesis' | 'mckinsey' | 'social' | 'startup'
    | 'pitch' | 'report' | 'strategy' | 'analysis'
    | 'product' | 'ux' | 'saas' | 'corrective'

// ✅ 12 DISTINCT layouts
export type LayoutType =
    | 'left-bar'       // Thin left bar + badge
    | 'top-banner'     // Full top banner
    | 'big-circles'    // Playful circles background
    | 'sidebar'        // 28% colored sidebar
    | 'hero-center'    // Big hero center
    | 'blocks'         // Each bullet in card
    | 'numbered'       // Huge numbers + text
    | 'split'          // 40/60 split
    | 'magazine'       // Editorial magazine
    | 'timeline'       // Horizontal timeline
    | 'grid-2x2'       // 2x2 grid cards
    | 'quote-focus'    // Big centered quote

export interface TemplateDefinition {
    id: TemplateId
    name: string
    description: string
    icon: string
    layout: LayoutType
    styles: {
        titleSlide: {
            alignment: 'center' | 'left'
            titleFontSize: number
            subtitleFontSize: number
            decoration: 'bar' | 'circle' | 'diagonal' | 'block' | 'none'
        }
        contentSlide: {
            bulletStyle: 'arrow' | 'check' | 'number' | 'dot' | 'square'
            accentPosition: 'left' | 'top' | 'none' | 'sidebar'
            alignment: 'left' | 'justify' | 'center'
        }
        colors: {
            primary: string
            secondary: string
            bg: string
            text: string
            accent: string
            cardBg: string
        }
    }
}

export const SLIDE_TEMPLATES: Record<TemplateId, TemplateDefinition> = {
    modern: {
        id: 'modern',
        name: 'Modern',
        description: 'Thin left bar with circular badge',
        icon: '✨',
        layout: 'left-bar',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 44, subtitleFontSize: 20, decoration: 'bar' },
            contentSlide: { bulletStyle: 'arrow', accentPosition: 'left', alignment: 'left' },
            colors: { primary: '6366F1', secondary: '818CF8', bg: 'F8FAFC', text: '1E293B', accent: '6366F1', cardBg: 'FFFFFF' },
        },
    },
    corporate: {
        id: 'corporate',
        name: 'Corporate',
        description: 'Full-width top banner header',
        icon: '💼',
        layout: 'top-banner',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 40, subtitleFontSize: 18, decoration: 'bar' },
            contentSlide: { bulletStyle: 'check', accentPosition: 'top', alignment: 'left' },
            colors: { primary: '0F172A', secondary: '334155', bg: 'F1F5F9', text: '0F172A', accent: '0F172A', cardBg: 'FFFFFF' },
        },
    },
    creative: {
        id: 'creative',
        name: 'Creative',
        description: 'Playful circles with rounded card',
        icon: '🎨',
        layout: 'big-circles',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 48, subtitleFontSize: 22, decoration: 'circle' },
            contentSlide: { bulletStyle: 'dot', accentPosition: 'none', alignment: 'justify' },
            colors: { primary: 'D946EF', secondary: 'F97316', bg: 'FDF2F8', text: '4C1D95', accent: 'D946EF', cardBg: 'FFFFFF' },
        },
    },
    academic: {
        id: 'academic',
        name: 'Academic',
        description: 'Huge numbers with text (publication style)',
        icon: '📚',
        layout: 'numbered',
        styles: {
            titleSlide: { alignment: 'left', titleFontSize: 36, subtitleFontSize: 18, decoration: 'none' },
            contentSlide: { bulletStyle: 'number', accentPosition: 'none', alignment: 'left' },
            colors: { primary: '0369A1', secondary: '38BDF8', bg: 'FFFFFF', text: '1E293B', accent: '0369A1', cardBg: 'F0F9FF' },
        },
    },
    thesis: {
        id: 'thesis',
        name: 'Thesis Defense',
        description: 'Colored sidebar with huge number',
        icon: '🎓',
        layout: 'sidebar',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 44, subtitleFontSize: 20, decoration: 'block' },
            contentSlide: { bulletStyle: 'number', accentPosition: 'sidebar', alignment: 'left' },
            colors: { primary: '7C3AED', secondary: 'A78BFA', bg: 'F8FAFC', text: '1E293B', accent: '7C3AED', cardBg: 'FFFFFF' },
        },
    },
    mckinsey: {
        id: 'mckinsey',
        name: 'McKinsey Report',
        description: 'Editorial magazine grid',
        icon: '📊',
        layout: 'magazine',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 40, subtitleFontSize: 18, decoration: 'bar' },
            contentSlide: { bulletStyle: 'dot', accentPosition: 'none', alignment: 'justify' },
            colors: { primary: '0F172A', secondary: '475569', bg: 'FFFFFF', text: '0F172A', accent: '1E40AF', cardBg: 'F8FAFC' },
        },
    },
    social: {
        id: 'social',
        name: 'Social Media',
        description: '2x2 grid of feature cards',
        icon: '📱',
        layout: 'grid-2x2',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 46, subtitleFontSize: 20, decoration: 'circle' },
            contentSlide: { bulletStyle: 'arrow', accentPosition: 'none', alignment: 'left' },
            colors: { primary: 'EC4899', secondary: 'F472B6', bg: 'FDF2F8', text: '831843', accent: 'EC4899', cardBg: 'FFFFFF' },
        },
    },
    startup: {
        id: 'startup',
        name: 'Startup Pitch',
        description: 'Bold hero header with stats',
        icon: '🚀',
        layout: 'hero-center',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 52, subtitleFontSize: 22, decoration: 'block' },
            contentSlide: { bulletStyle: 'arrow', accentPosition: 'none', alignment: 'center' },
            colors: { primary: 'F97316', secondary: 'FB923C', bg: 'FFF7ED', text: '431407', accent: 'F97316', cardBg: 'FFFFFF' },
        },
    },
    pitch: {
        id: 'pitch',
        name: 'Pitch Deck',
        description: 'Timeline-style progression',
        icon: '📈',
        layout: 'timeline',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 50, subtitleFontSize: 20, decoration: 'block' },
            contentSlide: { bulletStyle: 'check', accentPosition: 'left', alignment: 'left' },
            colors: { primary: '2563EB', secondary: '60A5FA', bg: 'F0F9FF', text: '1E3A8A', accent: '2563EB', cardBg: 'FFFFFF' },
        },
    },
    report: {
        id: 'report',
        name: 'Business Report',
        description: '40/60 split with title panel',
        icon: '📋',
        layout: 'split',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 40, subtitleFontSize: 18, decoration: 'bar' },
            contentSlide: { bulletStyle: 'check', accentPosition: 'top', alignment: 'left' },
            colors: { primary: '059669', secondary: '34D399', bg: 'F0FDF4', text: '064E3B', accent: '059669', cardBg: 'FFFFFF' },
        },
    },
    strategy: {
        id: 'strategy',
        name: 'Strategy Deck',
        description: 'Numbered strategy with big digits',
        icon: '🎯',
        layout: 'numbered',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 44, subtitleFontSize: 20, decoration: 'circle' },
            contentSlide: { bulletStyle: 'number', accentPosition: 'none', alignment: 'left' },
            colors: { primary: 'D97706', secondary: 'FBBF24', bg: 'FFFBEB', text: '78350F', accent: 'D97706', cardBg: 'FFFFFF' },
        },
    },
    analysis: {
        id: 'analysis',
        name: 'Data Analysis',
        description: 'Sidebar with analytics focus',
        icon: '📉',
        layout: 'sidebar',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 44, subtitleFontSize: 20, decoration: 'bar' },
            contentSlide: { bulletStyle: 'dot', accentPosition: 'sidebar', alignment: 'left' },
            colors: { primary: '0284C7', secondary: '38BDF8', bg: 'F0F9FF', text: '0C4A6E', accent: '0284C7', cardBg: 'FFFFFF' },
        },
    },
    product: {
        id: 'product',
        name: 'Product Launch',
        description: 'Each feature in its own card',
        icon: '🎁',
        layout: 'blocks',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 48, subtitleFontSize: 22, decoration: 'circle' },
            contentSlide: { bulletStyle: 'square', accentPosition: 'none', alignment: 'left' },
            colors: { primary: 'DC2626', secondary: 'F87171', bg: 'FEF2F2', text: '7F1D1D', accent: 'DC2626', cardBg: 'FFFFFF' },
        },
    },
    ux: {
        id: 'ux',
        name: 'UX Design',
        description: 'Magazine editorial style',
        icon: '🎨',
        layout: 'magazine',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 44, subtitleFontSize: 20, decoration: 'block' },
            contentSlide: { bulletStyle: 'dot', accentPosition: 'left', alignment: 'left' },
            colors: { primary: '0D9488', secondary: '2DD4BF', bg: 'F0FDFA', text: '042F2E', accent: '0D9488', cardBg: 'FFFFFF' },
        },
    },
    saas: {
        id: 'saas',
        name: 'SaaS GTM',
        description: 'Timeline of market strategy',
        icon: '☁️',
        layout: 'timeline',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 46, subtitleFontSize: 20, decoration: 'block' },
            contentSlide: { bulletStyle: 'check', accentPosition: 'top', alignment: 'left' },
            colors: { primary: '7C3AED', secondary: 'A78BFA', bg: 'F5F3FF', text: '2D1B69', accent: '7C3AED', cardBg: 'FFFFFF' },
        },
    },
    corrective: {
        id: 'corrective',
        name: 'Corrective Action',
        description: 'Grid of action items',
        icon: '🛠️',
        layout: 'grid-2x2',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 40, subtitleFontSize: 18, decoration: 'bar' },
            contentSlide: { bulletStyle: 'number', accentPosition: 'top', alignment: 'left' },
            colors: { primary: 'DC2626', secondary: 'F87171', bg: 'FEF2F2', text: '7F1D1D', accent: 'DC2626', cardBg: 'FFFFFF' },
        },
    },
}