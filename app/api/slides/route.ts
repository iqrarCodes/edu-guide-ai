import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ----- GET: Fetch all slides for current user -----
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch projects of type 'slides'
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      created_at,
      slides_data (id, outline, slides, template_id, status)
    `)
    .eq('user_id', user.id)
    .eq('type', 'slides')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// ----- POST: Create a new slides project -----
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // 1. Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([{
      user_id: user.id,
      type: 'slides',
      name,
      description: description || null,
    }])
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  // 2. Create empty slides_data entry
  const { data: slidesData, error: slidesError } = await supabase
    .from('slides_data')
    .insert([{
      project_id: project.id,
      status: 'draft',
    }])
    .select()
    .single()

  if (slidesError) {
    return NextResponse.json({ error: slidesError.message }, { status: 500 })
  }

  return NextResponse.json({ project, slidesData })
}