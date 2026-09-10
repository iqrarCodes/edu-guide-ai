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

  const template = SLIDE_TEMPLATES[templateId as TemplateId] || SLIDE_TEMPLATES.modern

  const prompt = `
You are an expert presentation designer. Generate exactly ${num_slides} slides about "${topic}" for audience "${audience}" in "${mode}" mode.

Each slide MUST have a "type" field chosen from this list:
- "content" → normal bullet points (most common)
- "chart" → when data/numbers/comparisons can be visualized
- "stats" → when highlighting 2-4 key metrics/numbers
- "process" → when explaining step-by-step steps (max 5 steps)
- "comparison" → when comparing two things side-by-side
- "quote" → when a strong statement/quote is needed
- "icon-grid" → when listing 4-6 short items with icons

Choose the BEST type for each slide content. Use variety - do NOT make all slides the same type.

Return ONLY a JSON array with this structure (fields depend on type):

For "content":
{"type":"content", "title":"...", "bullets":["...","..."], "key_takeaway":"..."}

For "chart":
{"type":"chart", "title":"...", "chartType":"bar|pie|line|doughnut", "chartData":[{"label":"A","value":30},{"label":"B","value":70}], "key_takeaway":"..."}

For "stats":
{"type":"stats", "title":"...", "stats":[{"value":"95%","label":"Accuracy"},{"value":"10K+","label":"Users"}], "key_takeaway":"..."}

For "process":
{"type":"process", "title":"...", "steps":["Step 1","Step 2","Step 3"], "key_takeaway":"..."}

For "comparison":
{"type":"comparison", "title":"...", "leftTitle":"Option A","leftItems":["...","..."], "rightTitle":"Option B","rightItems":["...","..."], "key_takeaway":"..."}

For "quote":
{"type":"quote", "title":"...", "quote":"The actual quote text here", "author":"Author Name", "key_takeaway":"..."}

For "icon-grid":
{"type":"icon-grid", "title":"...", "items":[{"icon":"★","label":"Item 1"},{"icon":"●","label":"Item 2"},{"icon":"◆","label":"Item 3"},{"icon":"▲","label":"Item 4"}], "key_takeaway":"..."}

CRITICAL RULES:
- Return ONLY valid JSON array. NO markdown, NO backticks.
- Every slide MUST have "type" and "title" and "key_takeaway".
- Use variety in slide types.
- Keep titles short (max 10 words).
- Keep bullets/items short (max 20 words each).
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
          { role: 'system', content: 'You are a JSON generator. Return ONLY a valid JSON array. No markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: model.maxTokens,
      })
      raw = response.choices[0].message.content || ''
      if (raw && raw.trim().length > 10) {
        console.log(`✅ ${model.name} returned ${raw.length} chars`)
        break
      }
    } catch (error: any) {
      console.error(`❌ ${model.name} error:`, error.message)
    }
  }

  // Fallback
  if (!raw || raw.trim().length < 10) {
    console.warn('All models failed, using fallback.')
    const fallbackSlides = []
    for (let i = 0; i < num_slides; i++) {
      fallbackSlides.push({
        type: 'content',
        title: `Slide ${i + 1}`,
        bullets: [`Key point ${i + 1}.1`, `Key point ${i + 1}.2`, `Key point ${i + 1}.3`],
        key_takeaway: `Takeaway for slide ${i + 1}`,
      })
    }
    return NextResponse.json({ slides: fallbackSlides, templateId }, { status: 200 })
  }

  // Parse JSON
  let slides: any[] = []
  try {
    let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    cleaned = cleaned.replace(/`/g, '')

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
    const objectMatch = cleaned.match(/\{[\s\S]*\}/)
    let jsonStr = arrayMatch ? arrayMatch[0] : (objectMatch ? objectMatch[0] : '')

    if (!jsonStr) throw new Error('No JSON found')

    let parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed)) {
      slides = parsed.slides && Array.isArray(parsed.slides) ? parsed.slides : [parsed]
    } else {
      slides = parsed
    }
  } catch (parseError) {
    console.error('Parse error:', parseError)
    slides = []
    for (let i = 0; i < num_slides; i++) {
      slides.push({
        type: 'content',
        title: `Slide ${i + 1}`,
        bullets: [`Key point ${i + 1}.1`, `Key point ${i + 1}.2`],
        key_takeaway: `Takeaway ${i + 1}`,
      })
    }
  }

  // Ensure every slide has type + title + key_takeaway
  slides = slides.map((slide: any, idx: number) => ({
    type: slide.type || 'content',
    title: slide.title || `Slide ${idx + 1}`,
    bullets: Array.isArray(slide.bullets) ? slide.bullets : [],
    steps: Array.isArray(slide.steps) ? slide.steps : [],
    stats: Array.isArray(slide.stats) ? slide.stats : [],
    chartType: slide.chartType || 'bar',
    chartData: Array.isArray(slide.chartData) ? slide.chartData : [],
    leftTitle: slide.leftTitle || '',
    leftItems: Array.isArray(slide.leftItems) ? slide.leftItems : [],
    rightTitle: slide.rightTitle || '',
    rightItems: Array.isArray(slide.rightItems) ? slide.rightItems : [],
    quote: slide.quote || '',
    author: slide.author || '',
    items: Array.isArray(slide.items) ? slide.items : [],
    key_takeaway: slide.key_takeaway || '',
  }))

  if (slides.length > num_slides) slides = slides.slice(0, num_slides)

  // Save to DB
  if (project_id) {
    await supabase
      .from('slides_data')
      .update({ slides, status: 'completed', template_id: templateId })
      .eq('project_id', project_id)
  }

  return NextResponse.json({
    slides,
    templateId,
    templateName: template.name,
  })
}