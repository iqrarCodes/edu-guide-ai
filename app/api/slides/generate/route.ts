import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { SLIDE_TEMPLATES, TemplateId } from '@/lib/slide-templates'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { project_id, topic, num_slides, style, audience, mode, outline, templateId = 'modern' } = body

  if (!topic || !num_slides) {
    return NextResponse.json({ error: 'Topic and num_slides required' }, { status: 400 })
  }

  // ----- Prompt with template context (optional but helps AI) -----
  const template = SLIDE_TEMPLATES[templateId as TemplateId] || SLIDE_TEMPLATES.modern
  const templateName = template.name
  const prompt = `
Generate exactly ${num_slides} slides about "${topic}".
Each slide must have:
- "title" (short, max 10 words)
- "bullets" (array of 5-7 key points, each 10-20 words)
- "key_takeaway" (one sentence)
- "speaker_notes" (3-4 sentences)

The slides will be styled with the "${templateName}" template, so focus on clean, scannable content.

Return ONLY a JSON array. No markdown, no backticks, no explanations.

Example: [{"title":"Introduction","bullets":["Point 1","Point 2"],"key_takeaway":"Key point","speaker_notes":"Note"}]
`

  const models = [
    { name: 'openai/gpt-oss-20b', maxTokens: 6000 },
    { name: 'qwen/qwen3.6-27b', maxTokens: 6000 },
  ]

  let raw = ''

  for (const model of models) {
    try {
      console.log(`🔄 Trying ${model.name}...`)
      const response = await groq.chat.completions.create({
        model: model.name,
        messages: [
          { role: 'system', content: 'You are a JSON generator. Return ONLY a valid JSON array. No markdown, no code fences, no backticks. Start with [ and end with ].' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: model.maxTokens,
      })
      raw = response.choices[0].message.content || ''
      if (raw && raw.trim().length > 10) {
        console.log(`✅ ${model.name} returned ${raw.length} chars`)
        break
      }
    } catch (error: any) {
      console.error(`❌ ${model.name} error:`, error.message || error)
    }
  }

  // Fallback if all fail
  if (!raw || raw.trim().length < 10) {
    console.warn('All models failed, using hardcoded fallback.')
    const fallbackSlides = []
    for (let i = 0; i < num_slides; i++) {
      fallbackSlides.push({
        title: `Slide ${i + 1}`,
        bullets: [`Key point ${i + 1}.1`, `Key point ${i + 1}.2`, `Key point ${i + 1}.3`],
        key_takeaway: `Takeaway for slide ${i + 1}`,
        speaker_notes: `Notes for slide ${i + 1}`,
      })
    }
    return NextResponse.json({ slides: fallbackSlides, templateId }, { status: 200 })
  }

  console.log('📝 RAW SLIDES RESPONSE (first 300 chars):', raw.substring(0, 300))

  // ----- Parse JSON -----
  let slides: any[] = []
  try {
    let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    cleaned = cleaned.replace(/`/g, '')

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
    const objectMatch = cleaned.match(/\{[\s\S]*\}/)
    let jsonStr = ''
    if (arrayMatch) {
      jsonStr = arrayMatch[0]
    } else if (objectMatch) {
      jsonStr = objectMatch[0]
    } else {
      throw new Error('No JSON found')
    }

    let parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed)) {
      if (parsed.slides && Array.isArray(parsed.slides)) {
        slides = parsed.slides
      } else {
        slides = [parsed]
      }
    } else {
      slides = parsed
    }
  } catch (parseError) {
    console.error('Slides parse error, using fallback:', parseError)
    slides = []
    for (let i = 0; i < num_slides; i++) {
      slides.push({
        title: `Slide ${i + 1}`,
        bullets: [`Key point ${i + 1}.1`, `Key point ${i + 1}.2`, `Key point ${i + 1}.3`],
        key_takeaway: `Takeaway for slide ${i + 1}`,
        speaker_notes: `Notes for slide ${i + 1}`,
      })
    }
  }

  // Ensure each slide has required fields
  slides = slides.map((slide: any, idx: number) => ({
    title: slide.title || `Slide ${idx + 1}`,
    bullets: Array.isArray(slide.bullets) ? slide.bullets : ['No bullet points provided.'],
    key_takeaway: slide.key_takeaway || 'Key takeaway.',
    speaker_notes: slide.speaker_notes || 'Speaker notes.',
  }))

  if (slides.length > num_slides) slides = slides.slice(0, num_slides)

  // Save to Supabase
  if (project_id) {
    await supabase
      .from('slides_data')
      .update({ slides, status: 'completed', template_id: templateId })
      .eq('project_id', project_id)
  }

  // Return slides + template info for preview
  return NextResponse.json({
    slides,
    templateId,
    templateName: template.name,
    colors: template.styles.colors,
  })
}