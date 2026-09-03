import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { project_id, topic, num_slides, style, audience, mode, outline } = body

  if (!topic || !num_slides) {
    return NextResponse.json({ error: 'Topic and num_slides required' }, { status: 400 })
  }

  // ----- Ultra-simple prompt (no outline, no style, just the basics) -----
  const simplePrompt = `
Generate exactly ${num_slides} slides about "${topic}".
Each slide must have:
- "title" (short, max 10 words)
- "bullets" (array of 5-7 key points, each 10-20 words)
- "key_takeaway" (one sentence)
- "speaker_notes" (3-4 sentences)

Return ONLY a JSON array. No markdown, no backticks, no explanations.

Example: [{"title":"Introduction","bullets":["Point 1","Point 2"],"key_takeaway":"Key point","speaker_notes":"Note"}]
`

  // ----- Models to try (order matters: best first) -----
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
          { role: 'user', content: simplePrompt }
        ],
        temperature: 0.5,
        max_tokens: model.maxTokens,
      })
      raw = response.choices[0].message.content || ''
      if (raw && raw.trim().length > 10) {
        console.log(`✅ ${model.name} returned ${raw.length} chars`)
        break
      } else {
        console.warn(`⚠️ ${model.name} returned empty, trying next...`)
      }
    } catch (error: any) {
      console.error(`❌ ${model.name} error:`, error.message || error)
    }
  }

  // ----- If still empty, fallback to hardcoded slides -----
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
    return NextResponse.json({ slides: fallbackSlides }, { status: 200 })
  }

  console.log('📝 RAW SLIDES RESPONSE (first 300 chars):', raw.substring(0, 300))

  // ----- Extract JSON using regex (handles incomplete JSON) -----
  let slides: any[] = []
  try {
    // Remove any markdown code fences
    let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    // Remove any <think> blocks
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    // Remove all backticks
    cleaned = cleaned.replace(/`/g, '')

    // Try to find a JSON array or object using regex
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

    // Try to parse
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
    // Fallback: generate basic slides
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

  // Trim to requested number
  if (slides.length > num_slides) slides = slides.slice(0, num_slides)

  // Save to Supabase
  if (project_id) {
    await supabase
      .from('slides_data')
      .update({ slides, status: 'completed' })
      .eq('project_id', project_id)
  }

  return NextResponse.json({ slides })
}