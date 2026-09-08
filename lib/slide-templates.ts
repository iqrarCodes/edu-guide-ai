// lib/slide-templates.ts

export type TemplateId = 'modern' | 'corporate' | 'creative' | 'academic'

export interface TemplateDefinition {
    id: TemplateId
    name: string
    description: string
    icon: string
    styles: {
        titleSlide: {
            alignment: 'center' | 'left'
            titleFontSize: number
            subtitleFontSize: number
            decoration: 'bar' | 'circle' | 'none'
        }
        contentSlide: {
            bulletStyle: 'arrow' | 'check' | 'number' | 'dot'
            accentPosition: 'left' | 'top' | 'none'
            alignment: 'left' | 'justify'
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
        description: 'Clean left-accent bar, minimalist',
        icon: '✨',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 44, subtitleFontSize: 20, decoration: 'bar' },
            contentSlide: { bulletStyle: 'arrow', accentPosition: 'left', alignment: 'left' },
            colors: { primary: '6366F1', secondary: '818CF8', bg: 'F8FAFC', text: '1E293B', accent: '6366F1', cardBg: 'FFFFFF' },
        },
    },
    corporate: {
        id: 'corporate',
        name: 'Corporate',
        description: 'Top banner, formal & bold',
        icon: '💼',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 40, subtitleFontSize: 18, decoration: 'bar' },
            contentSlide: { bulletStyle: 'check', accentPosition: 'top', alignment: 'left' },
            colors: { primary: '0F172A', secondary: '334155', bg: 'F1F5F9', text: '0F172A', accent: '0F172A', cardBg: 'FFFFFF' },
        },
    },
    creative: {
        id: 'creative',
        name: 'Creative',
        description: 'Bold colors, overlapping shapes',
        icon: '🎨',
        styles: {
            titleSlide: { alignment: 'center', titleFontSize: 48, subtitleFontSize: 22, decoration: 'circle' },
            contentSlide: { bulletStyle: 'number', accentPosition: 'none', alignment: 'justify' },
            colors: { primary: 'D946EF', secondary: 'F97316', bg: 'FDF2F8', text: '4C1D95', accent: 'D946EF', cardBg: 'FFFFFF' },
        },
    },
    academic: {
        id: 'academic',
        name: 'Academic',
        description: 'Classic, structured, two-column',
        icon: '📚',
        styles: {
            titleSlide: { alignment: 'left', titleFontSize: 36, subtitleFontSize: 18, decoration: 'none' },
            contentSlide: { bulletStyle: 'dot', accentPosition: 'none', alignment: 'justify' },
            colors: { primary: '0369A1', secondary: '38BDF8', bg: 'FFFFFF', text: '1E293B', accent: '0369A1', cardBg: 'F0F9FF' },
        },
    },
}