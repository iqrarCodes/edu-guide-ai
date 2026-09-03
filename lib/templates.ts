// lib/templates.ts

export interface Template {
    id: string
    name: string
    icon: string
    description: string
    colors: {
        bg: string
        bgAlt: string
        accent: string
        accent2: string
        title: string
        text: string
        highlight: string
        cardBg: string
    }
    layouts: {
        title: SlideLayout
        content: SlideLayout
        image: SlideLayout
        comparison: SlideLayout
        divider: SlideLayout
    }
}

interface SlideLayout {
    titlePosition: 'left' | 'center' | 'right'
    textAlignment: 'left' | 'center'
    imagePosition?: 'left' | 'right' | 'top' | 'background' | 'none'
    showShapes: boolean
    shapeType?: 'rect' | 'circle' | 'curve' | 'none'
    showDivider: boolean
}

export const TEMPLATES: Record<string, Template> = {
    modern: {
        id: 'modern',
        name: 'Modern',
        icon: '📊',
        description: 'Clean, minimal design with bold accents',
        colors: {
            bg: '#F8FAFC',
            bgAlt: '#F1F5F9',
            accent: '#6366F1',
            accent2: '#818CF8',
            title: '#1E293B',
            text: '#334155',
            highlight: '#E0E7FF',
            cardBg: '#FFFFFF',
        },
        layouts: {
            title: {
                titlePosition: 'left',
                textAlignment: 'left',
                imagePosition: 'right',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
            content: {
                titlePosition: 'left',
                textAlignment: 'left',
                imagePosition: 'right',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
            image: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'top',
                showShapes: false,
                shapeType: 'none',
                showDivider: false,
            },
            comparison: {
                titlePosition: 'center',
                textAlignment: 'left',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
            divider: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'circle',
                showDivider: true,
            },
        },
    },
    creative: {
        id: 'creative',
        name: 'Creative',
        icon: '🎨',
        description: 'Bold, vibrant design with overlapping shapes',
        colors: {
            bg: '#FDF4FF',
            bgAlt: '#FAE8FF',
            accent: '#D946EF',
            accent2: '#F472B6',
            title: '#4C1D95',
            text: '#5B21B6',
            highlight: '#F3E8FF',
            cardBg: '#FFFFFF',
        },
        layouts: {
            title: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'background',
                showShapes: true,
                shapeType: 'circle',
                showDivider: true,
            },
            content: {
                titlePosition: 'left',
                textAlignment: 'left',
                imagePosition: 'right',
                showShapes: true,
                shapeType: 'curve',
                showDivider: true,
            },
            image: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'top',
                showShapes: true,
                shapeType: 'circle',
                showDivider: false,
            },
            comparison: {
                titlePosition: 'center',
                textAlignment: 'left',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'circle',
                showDivider: true,
            },
            divider: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
        },
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        icon: '💼',
        description: 'Corporate, elegant design for formal presentations',
        colors: {
            bg: '#FFFFFF',
            bgAlt: '#F8FAFC',
            accent: '#0F172A',
            accent2: '#1E293B',
            title: '#0F172A',
            text: '#1E293B',
            highlight: '#E2E8F0',
            cardBg: '#FFFFFF',
        },
        layouts: {
            title: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'background',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
            content: {
                titlePosition: 'left',
                textAlignment: 'left',
                imagePosition: 'right',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
            image: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'top',
                showShapes: false,
                shapeType: 'none',
                showDivider: false,
            },
            comparison: {
                titlePosition: 'center',
                textAlignment: 'left',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
            divider: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
        },
    },
    organic: {
        id: 'organic',
        name: 'Organic',
        icon: '🌿',
        description: 'Warm, natural design with soft, flowing shapes',
        colors: {
            bg: '#F0FDF4',
            bgAlt: '#ECFDF5',
            accent: '#059669',
            accent2: '#10B981',
            title: '#064E3B',
            text: '#047857',
            highlight: '#D1FAE5',
            cardBg: '#FFFFFF',
        },
        layouts: {
            title: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'background',
                showShapes: true,
                shapeType: 'curve',
                showDivider: true,
            },
            content: {
                titlePosition: 'left',
                textAlignment: 'left',
                imagePosition: 'right',
                showShapes: true,
                shapeType: 'curve',
                showDivider: true,
            },
            image: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'top',
                showShapes: true,
                shapeType: 'circle',
                showDivider: false,
            },
            comparison: {
                titlePosition: 'center',
                textAlignment: 'left',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'curve',
                showDivider: true,
            },
            divider: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'circle',
                showDivider: true,
            },
        },
    },
    dark: {
        id: 'dark',
        name: 'Dark',
        icon: '🌙',
        description: 'Modern, premium dark design with neon accents',
        colors: {
            bg: '#0F0F1A',
            bgAlt: '#1A1A2E',
            accent: '#A78BFA',
            accent2: '#7C3AED',
            title: '#FFFFFF',
            text: '#D1D5DB',
            highlight: '#2D2D4A',
            cardBg: '#1A1A2E',
        },
        layouts: {
            title: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'background',
                showShapes: true,
                shapeType: 'circle',
                showDivider: true,
            },
            content: {
                titlePosition: 'left',
                textAlignment: 'left',
                imagePosition: 'right',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
            image: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'top',
                showShapes: true,
                shapeType: 'circle',
                showDivider: false,
            },
            comparison: {
                titlePosition: 'center',
                textAlignment: 'left',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'rect',
                showDivider: true,
            },
            divider: {
                titlePosition: 'center',
                textAlignment: 'center',
                imagePosition: 'none',
                showShapes: true,
                shapeType: 'circle',
                showDivider: true,
            },
        },
    },
}

export const TEMPLATE_IDS = Object.keys(TEMPLATES)