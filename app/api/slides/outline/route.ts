import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slidesGroq } from '@/lib/groq-clients'   // ✅ Slides client

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { project_id, topic, audience, mode } = body

  if (!topic) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const prompt = `
Create a detailed outline for a presentation on "${topic}" for an audience of "${audience || 'General'}" in "${mode || 'Standard'}" mode.
The outline should follow a narrative flow: Problem → Importance → Current Situation → Evidence → Challenges → Solution → Benefits → Future → Conclusion.
Return ONLY a JSON array of objects, each with "title" and "description". No markdown.
Example: [{"title": "The Problem", "description": "Describe the core issue"}, ...]
`

  try {
    const response = await slidesGroq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: 'You are a JSON generator. Return ONLY a valid JSON array. No markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    })

    const raw = response.choices[0].message.content || ''
    console.log('📝 RAW OUTLINE:', raw.substring(0, 300))

    let outline = []
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      const start = cleaned.indexOf('[')
      const end = cleaned.lastIndexOf(']') + 1
      if (start === -1 || end === 0) throw new Error('No JSON array found')
      const jsonStr = cleaned.substring(start, end)
      outline = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Outline parse error, using fallback:', parseError)
      outline = [
        { title: `Introduction to ${topic}`, description: `Overview of ${topic}` },
        { title: 'Key Concepts', description: 'Main ideas and definitions' },
        { title: 'Applications', description: 'Real-world use cases' },
        { title: 'Challenges', description: 'Current limitations' },
        { title: 'Future Outlook', description: 'Trends and predictions' },
      ]
    }

    outline = outline.map((item: any) => ({
      title: item.title || 'Untitled',
      description: item.description || 'No description.',
    }))

    if (project_id) {
      await supabase
        .from('slides_data')
        .update({ outline })
        .eq('project_id', project_id)
    }

    return NextResponse.json({ outline })
  } catch (error) {
    console.error('Outline generation error:', error)
    return NextResponse.json({ error: 'Failed to generate outline' }, { status: 500 })
  }
}