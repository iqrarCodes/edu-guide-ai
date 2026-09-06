export type ProjectType = 'slides' | 'quiz' | 'lesson_plan' | 'script' | 'other'

export interface Project {
  id: string
  user_id: string
  name: string
  type: ProjectType
  description?: string
  created_at: string
  updated_at?: string
}

export interface NavItem {
  icon: React.ElementType
  label: string
  active?: boolean
  href?: string
}