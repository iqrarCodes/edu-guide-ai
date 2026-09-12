import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { SLIDE_TEMPLATES, TemplateId } from '@/lib/slide-templates'

// ✅ Use the dedicated Slides API key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_SLIDES })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { project_id, topic, num_slides, style, audience, mode, templateId = 'modern' } = body

  if (!topic || !num_slides) {
    return NextResponse.json({ error: 'Topic and num_slides required' }, { status: 400 })
  }

  const template = SLIDE_TEMPLATES[templateId as TemplateId] || SLIDE_TEMPLATES.modern

  const prompt = `Create a detailed presentation on "${topic}".
Audience: ${audience || 'General'}
Mode: ${mode || 'Educational'}
Total slides: EXACTLY ${num_slides}

═══════════════════════════════════════════════════
⚠️  STRICT CONTENT RULES (READ CAREFULLY)
═══════════════════════════════════════════════════

RULE 1: EVERY bullet MUST be 25-40 words (2-3 full sentences).
  ❌ FORBIDDEN: "Personalized learning"
  ❌ FORBIDDEN: "AI tutors help students"
  ✅ REQUIRED: "AI-powered tutoring systems analyze each student's response patterns to identify knowledge gaps, then automatically adjust the difficulty level and provide targeted practice exercises that address the specific weakness, resulting in 40% faster skill acquisition."

RULE 2: EVERY content slide MUST have EXACTLY 5 bullets.

RULE 3: Each bullet MUST include: WHAT, WHY/HOW, and a specific example/number.

RULE 4: NO generic phrases. Every sentence must add new information.

RULE 5: Include REAL data/numbers/percentages wherever possible.

═══════════════════════════════════════════════════
SLIDE TYPES (use variety)
═══════════════════════════════════════════════════

1. "content" → 5 bullets (25-40 words each), title, key_takeaway
2. "stats" → 4 stats [{value, label}]
3. "chart" → chartType (bar/pie/line/doughnut), chartData with 6 items [{label, value}]
4. "process" → 5 steps (each 20-35 words)
5. "comparison" → leftTitle, leftItems [5], rightTitle, rightItems [5]
6. "quote" → quote (20-35 words), author
7. "icon-grid" → 6 items [{icon: "★", label: "3-6 word concept"}]

═══════════════════════════════════════════════════
OUTPUT: JSON ARRAY ONLY (No markdown, no explanation)
═══════════════════════════════════════════════════

NOW GENERATE EXACTLY ${num_slides} SLIDES FOR "${topic}".

CRITICAL: Every content bullet MUST be 25-40 words. Non-negotiable.`

  const models = [
    { name: 'qwen/qwen3.6-27b', maxTokens: 8000 },
    { name: 'openai/gpt-oss-120b', maxTokens: 8000 },
    { name: 'openai/gpt-oss-20b', maxTokens: 8000 },
  ]

  let raw = ''
  let usedModel = ''

  for (const model of models) {
    try {
      console.log(`🔄 Trying ${model.name}...`)
      const response = await groq.chat.completions.create({
        model: model.name,
        messages: [
          {
            role: 'system',
            content: 'You are an expert presentation writer. Write detailed, explanatory bullets of 25-40 words each. Return ONLY valid JSON arrays.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: model.maxTokens,
      })
      raw = response.choices[0].message.content || ''
      if (raw && raw.trim().length > 500) {
        console.log(`✅ ${model.name} returned ${raw.length} chars`)
        usedModel = model.name
        break
      }
    } catch (error: any) {
      console.error(`❌ ${model.name} error:`, error.message)
    }
  }

  // Fallback
  if (!raw || raw.trim().length < 500) {
    console.warn('All models failed, using fallback.')
    const fallbackSlides = []
    for (let i = 0; i < num_slides; i++) {
      fallbackSlides.push({
        type: 'content',
        title: `${topic} - Part ${i + 1}`,
        bullets: [
          `This section explores the first critical aspect of ${topic}, explaining why it matters in today's context and how it impacts the broader landscape.`,
          `The second key point provides concrete evidence and real-world examples demonstrating the practical applications and measurable outcomes observed in recent studies.`,
          `Third, we examine the underlying mechanisms and processes that drive these developments, offering insights into how organizations can effectively leverage them.`,
          `Furthermore, this analysis considers the potential challenges and limitations, providing a balanced perspective on what to expect in the coming years.`,
          `Finally, we look at future trends and predictions, with specific data points suggesting significant growth ahead for ${topic}.`,
        ],
        key_takeaway: `Understanding these aspects of ${topic} is essential for making informed decisions in the modern landscape.`,
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
    let jsonStr = ''
    if (arrayMatch) {
      jsonStr = arrayMatch[0]
    } else {
      const objectMatch = cleaned.match(/\{[\s\S]*\}/)
      jsonStr = objectMatch ? objectMatch[0] : ''
    }

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
        title: `${topic} - Slide ${i + 1}`,
        bullets: [
          `Detailed explanation of the first key aspect with proper context and reasoning that helps understand the topic better.`,
          `Second important point that provides additional value and insight to the audience with real examples.`,
          `Third aspect exploring the practical applications and how it impacts real-world scenarios.`,
          `Fourth point covering the implications and what it means for the future.`,
          `Fifth point summarizing the overall significance with concrete data.`,
        ],
        key_takeaway: `Key insight about this aspect of ${topic}.`,
      })
    }
  }

  // Normalize slides
  slides = slides.map((slide: any, idx: number) => ({
    type: slide.type || 'content',
    title: slide.title || `${topic} - ${idx + 1}`,
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

  while (slides.length < num_slides) {
    const extra = slides.find((s: any) => s.type === 'content') || slides[0]
    slides.push({
      ...extra,
      title: `${topic} - Additional Point ${slides.length + 1}`,
    })
  }

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
    usedModel,
  })
}