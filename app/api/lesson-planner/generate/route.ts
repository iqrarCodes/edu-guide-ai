import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLessonPlan } from '@/lib/lesson-planner/generator'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { topic, grade, subject, duration } = body

  if (!topic || !grade || !subject) {
    return NextResponse.json({ error: 'Topic, grade, and subject are required' }, { status: 400 })
  }

  try {
    // Generate lesson plan using AI – this function now uses lessonPlannerGroq internally
    const lessonPlan = await generateLessonPlan(topic, grade, subject, duration || '45 mins')

    // Save to Supabase
    const { data, error } = await supabase
      .from('lesson_plans')
      .insert([{
        user_id: user.id,
        topic,
        grade,
        subject,
        duration: duration || '45 mins',
        objectives: lessonPlan.objectives,
        activities: lessonPlan.activities,
        assessments: lessonPlan.assessments,
        homework: lessonPlan.homework,
        materials: lessonPlan.materials,
        teacher_notes: lessonPlan.teacher_notes,
      }])
      .select()
      .single()

    if (error) throw error

    // Also add to projects table for dashboard stats
    await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        type: 'lesson_plan',
        name: `Lesson: ${topic}`,
        description: `${subject} - ${grade}`,
      }])

    return NextResponse.json({ success: true, lessonPlanId: data.id, ...lessonPlan })
  } catch (error: any) {
    console.error('Lesson plan generation error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}