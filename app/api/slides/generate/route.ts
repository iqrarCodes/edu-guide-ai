import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { SLIDE_TEMPLATES, TemplateId } from '@/lib/slide-templates'

const slidesGroq = new Groq({ apiKey: process.env.GROQ_API_KEY_SLIDES })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { project_id, topic, outline, audience, mode, style, templateId = 'modern' } = body

  if (!topic || !outline || !Array.isArray(outline) || outline.length === 0) {
    return NextResponse.json({ error: 'Topic and outline required' }, { status: 400 })
  }

  const template = SLIDE_TEMPLATES[templateId as TemplateId] || SLIDE_TEMPLATES.modern

  const outlineContext = outline
    .map((item: any, i: number) => `${i + 1}. "${item.title}" — ${item.description}`)
    .join('\n')

  const prompt = `You are writing slides for a presentation on "${topic}".

═══════════════════════════════════════════════════
⚠️  STRICT LENGTH RULES (MUST FOLLOW)
═══════════════════════════════════════════════════

RULE 1: Each content bullet MUST be 15-20 words (ONE short sentence).
  ❌ TOO LONG: "AI-powered tutoring systems analyze each student's response patterns to identify knowledge gaps, then automatically adjust the difficulty level and provide targeted practice exercises that address the specific weakness, resulting in 40% faster skill acquisition."
  ✅ PERFECT: "AI analyzes each student's responses to identify knowledge gaps and adjust difficulty automatically."

RULE 2: Each content slide MUST have EXACTLY 4 bullets (not 5, not 6).
  If you have more information, create a NEW slide.

RULE 3: Process steps must be SHORT (8-12 words each).
  ✅ GOOD: "Identify the research question and define key variables."

RULE 4: Comparison items must be SHORT (10-15 words each), MAX 4 per side.

RULE 5: Stats labels must be SHORT (4-6 words).
  ✅ GOOD: "students use AI daily"

RULE 6: Chart data labels must be ONE WORD OR TWO (max).

═══════════════════════════════════════════════════
OUTLINE (each item = one slide)
═══════════════════════════════════════════════════

${outlineContext}

═══════════════════════════════════════════════════
SLIDE TYPES (use variety)
═══════════════════════════════════════════════════

1. "content" → 4 bullets, 15-20 words each, key_takeaway
2. "stats" → 4 stats, short labels (4-6 words)
3. "chart" → chartType, 5-6 chartData items with 1-2 word labels
4. "process" → 4-5 steps, each 8-12 words
5. "comparison" → 2 titles, 4 items per side (10-15 words each)
6. "quote" → 20-25 word quote, author
7. "icon-grid" → 6 items with 3-5 word labels

═══════════════════════════════════════════════════
OUTPUT: EXACTLY ${outline.length} SLIDES (JSON ARRAY)
═══════════════════════════════════════════════════

For each slide use the outline item's title EXACTLY as the slide title.

Return ONLY the JSON array. No markdown. No explanation.

NOW GENERATE ${outline.length} SLIDES.`

  const models = [
    { name: 'openai/gpt-oss-120b', maxTokens: 6000 },
    { name: 'qwen/qwen3.6-27b', maxTokens: 6000 },
    { name: 'openai/gpt-oss-20b', maxTokens: 6000 },
  ]

  let raw = ''
  let usedModel = ''

  for (const model of models) {
    try {
      const response = await slidesGroq.chat.completions.create({
        model: model.name,
        messages: [
          { role: 'system', content: 'You write concise slide content. 15-20 words per bullet. Return ONLY valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: model.maxTokens,
      })
      raw = response.choices[0].message.content || ''
      if (raw && raw.trim().length > 500) {
        usedModel = model.name
        break
      }
    } catch (error: any) {
      console.error(`❌ ${model.name}:`, error.message)
    }
  }

  if (!raw || raw.trim().length < 500) {
    const fallback = outline.map((item: any) => ({
      type: 'content',
      title: item.title,
      bullets: [
        `${item.description?.substring(0, 80) || item.title} explained in simple terms.`,
        `Key concept behind ${item.title} and why it matters.`,
        `Real-world applications and examples of ${item.title}.`,
        `Future implications and what to expect next.`,
      ],
      key_takeaway: `Understanding ${item.title} helps build comprehensive knowledge.`,
    }))
    return NextResponse.json({ slides: fallback, templateId }, { status: 200 })
  }

  let slides: any[] = []
  try {
    let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/`/g, '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (match) {
      slides = JSON.parse(match[0])
    }
  } catch (e) {
    console.error('Parse error:', e)
    slides = []
  }

  if (!slides.length) {
    slides = outline.map((item: any) => ({
      type: 'content',
      title: item.title,
      bullets: [
        `${item.title} is essential for understanding this topic.`,
        `Key elements include specific components and relationships.`,
        `Real applications demonstrate practical value.`,
        `Future developments will expand its impact.`,
      ],
      key_takeaway: `Understanding ${item.title} is fundamental.`,
    }))
  }

  // Normalize + limit content
  slides = slides.map((slide: any, idx: number) => ({
    type: slide.type || 'content',
    title: slide.title || outline[idx]?.title || `Slide ${idx + 1}`,
    bullets: Array.isArray(slide.bullets) ? slide.bullets.slice(0, 4) : [],
    steps: Array.isArray(slide.steps) ? slide.steps.slice(0, 5) : [],
    stats: Array.isArray(slide.stats) ? slide.stats.slice(0, 4) : [],
    chartType: slide.chartType || 'bar',
    chartData: Array.isArray(slide.chartData) ? slide.chartData.slice(0, 6) : [],
    leftTitle: slide.leftTitle || '',
    leftItems: Array.isArray(slide.leftItems) ? slide.leftItems.slice(0, 4) : [],
    rightTitle: slide.rightTitle || '',
    rightItems: Array.isArray(slide.rightItems) ? slide.rightItems.slice(0, 4) : [],
    quote: slide.quote || '',
    author: slide.author || '',
    items: Array.isArray(slide.items) ? slide.items.slice(0, 6) : [],
    key_takeaway: slide.key_takeaway || '',
  }))

  slides = slides.slice(0, outline.length)
  while (slides.length < outline.length) {
    const item = outline[slides.length]
    slides.push({
      type: 'content',
      title: item.title,
      bullets: [
        `Key aspect of ${item.title} explained clearly.`,
        `Practical applications and real-world relevance.`,
        `Important considerations and implications.`,
        `Future outlook and emerging trends.`,
      ],
      key_takeaway: `${item.title} is central to this topic.`,
    })
  }

  if (project_id) {
    await supabase
      .from('slides_data')
      .update({ slides, status: 'completed', template_id: templateId })
      .eq('project_id', project_id)
  }

  return NextResponse.json({ slides, templateId, templateName: template.name, usedModel })
}