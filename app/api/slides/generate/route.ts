import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { SLIDE_TEMPLATES, TemplateId } from '@/lib/slide-templates'

// ✅ Dedicated Slides API key (different from outline)
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

  // Build outline context for AI
  const outlineContext = outline
    .map((item: any, i: number) => `${i + 1}. "${item.title}" — ${item.description}`)
    .join('\n')

  const prompt = `You are an expert presentation writer. Write slides that EXACTLY MATCH the given outline.

═══════════════════════════════════════════════════
PRESENTATION CONTEXT
═══════════════════════════════════════════════════

Topic: "${topic}"
Audience: ${audience || 'General'}
Mode: ${mode || 'Educational'}
Style: ${style || 'Educational'}
Total slides: EXACTLY ${outline.length}

═══════════════════════════════════════════════════
THE OUTLINE (each slide MUST match one section)
═══════════════════════════════════════════════════

${outlineContext}

═══════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════

RULE 1: Generate EXACTLY ${outline.length} slides — one slide per outline section.
  - Slide 1 = Section 1 ("${outline[0]?.title}")
  - Slide 2 = Section 2 ("${outline[1]?.title || ''}")
  - ... and so on.

RULE 2: Each slide's TITLE must be the outline section's title.
   Do NOT invent new titles. Use the EXACT outline title.

RULE 3: Each slide's CONTENT must address the outline section's DESCRIPTION.
   The bullets should expand on what the description says.

RULE 4: EVERY content bullet MUST be 25-40 words (2-3 sentences).
  ❌ BAD: "Personalized learning"
  ✅ GOOD: "AI-powered tutoring systems analyze student response patterns to identify specific knowledge gaps, then automatically adjust difficulty levels and provide targeted practice exercises, resulting in 40% faster skill acquisition according to Stanford research."

RULE 5: EVERY content slide MUST have 5 detailed bullets.
   Each bullet includes: WHAT, WHY/HOW, and a specific example/number.

RULE 6: Slide type should MATCH the section content:
   - Use "content" for most sections (bullets)
   - Use "stats" if section is about numbers/metrics
   - Use "chart" if section compares data
   - Use "process" if section is about steps/flow
   - Use "comparison" if section compares two things
   - Use "quote" if section is about a concept/idea
   - Use "icon-grid" if section lists 4-6 items

═══════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════

Return ONLY a valid JSON array with EXACTLY ${outline.length} items.

For "content" slide:
{"type":"content","title":"EXACT_OUTLINE_TITLE","bullets":["25-40 word bullet 1","bullet 2","bullet 3","bullet 4","bullet 5"],"key_takeaway":"One-sentence summary (20-30 words)."}

For "stats" slide:
{"type":"stats","title":"EXACT_OUTLINE_TITLE","stats":[{"value":"85%","label":"detailed 6-10 word label"},{"value":"10K+","label":"..."},{"value":"3.5h","label":"..."},{"value":"$6.5B","label":"..."}],"key_takeaway":"..."}

For "chart" slide:
{"type":"chart","title":"EXACT_OUTLINE_TITLE","chartType":"bar","chartData":[{"label":"...","value":45},{"label":"...","value":72},...6 items],"key_takeaway":"..."}

For "process" slide:
{"type":"process","title":"EXACT_OUTLINE_TITLE","steps":["Detailed 25-35 word step 1","step 2","step 3","step 4","step 5"],"key_takeaway":"..."}

For "comparison" slide:
{"type":"comparison","title":"EXACT_OUTLINE_TITLE","leftTitle":"Option A","leftItems":["25-word bullet","...5 total"],"rightTitle":"Option B","rightItems":["25-word bullet","...5 total"],"key_takeaway":"..."}

For "quote" slide:
{"type":"quote","title":"EXACT_OUTLINE_TITLE","quote":"A powerful 20-35 word statement related to the outline section","author":"Author name or 'Expert Insight'","key_takeaway":"..."}

For "icon-grid" slide:
{"type":"icon-grid","title":"EXACT_OUTLINE_TITLE","items":[{"icon":"★","label":"3-6 word concept"},...6 total],"key_takeaway":"..."}

NOW GENERATE ${outline.length} SLIDES. Every slide must EXACTLY match its outline section.
Return ONLY the JSON array. No markdown. No explanation.`

  const models = [
    { name: 'openai/gpt-oss-120b', maxTokens: 8000 },
    { name: 'openai/gpt-oss-20b', maxTokens: 8000 },
    { name: 'qwen/qwen3.6-27b', maxTokens: 8000 },
  ]

  let raw = ''
  let usedModel = ''

  for (const model of models) {
    try {
      console.log(`🔄 Trying ${model.name}...`)
      const response = await slidesGroq.chat.completions.create({
        model: model.name,
        messages: [
          {
            role: 'system',
            content: 'You are an expert presentation writer. Follow the outline EXACTLY. Write detailed bullets of 25-40 words. Return ONLY valid JSON arrays.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
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

  // Fallback: Generate basic slides from outline
  if (!raw || raw.trim().length < 500) {
    console.warn('All models failed, using outline-based fallback.')
    const fallbackSlides = outline.map((item: any, i: number) => ({
      type: 'content',
      title: item.title,
      bullets: [
        `Detailed explanation of the first key point about "${item.title}" with proper context and specific examples.`,
        `Second important aspect with supporting data and real-world applications of this concept.`,
        `Third point exploring the mechanisms and underlying processes that make this work.`,
        `Fourth aspect covering implications, benefits, and how this impacts the broader field.`,
        `Fifth point discussing challenges, limitations, and what the future holds.`,
      ],
      key_takeaway: `Understanding ${item.title} is essential for a complete picture of ${topic}.`,
    }))
    return NextResponse.json({ slides: fallbackSlides, templateId }, { status: 200 })
  }

  // Parse JSON
  let slides: any[] = []
  try {
    let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/`/g, '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    let parsed = JSON.parse(match[0])
    slides = Array.isArray(parsed) ? parsed : [parsed]
  } catch (parseError) {
    console.error('Parse error:', parseError)
    slides = outline.map((item: any) => ({
      type: 'content',
      title: item.title,
      bullets: [
        `Comprehensive explanation of ${item.title} with context and examples.`,
        `Second detailed point expanding on the concepts discussed in this section.`,
        `Third aspect providing additional value and practical applications.`,
        `Fourth point discussing implications and impact of this topic.`,
        `Fifth point summarizing key insights and takeaways.`,
      ],
      key_takeaway: `Key insights about ${item.title}.`,
    }))
  }

  // Ensure slides match outline count
  slides = slides.map((slide: any, idx: number) => {
    const outlineItem = outline[idx] || {}
    return {
      type: slide.type || 'content',
      title: slide.title || outlineItem.title || `Slide ${idx + 1}`,
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
    }
  })

  // Ensure exact count
  slides = slides.slice(0, outline.length)
  while (slides.length < outline.length) {
    const item = outline[slides.length]
    slides.push({
      type: 'content',
      title: item.title,
      bullets: [
        `Detailed explanation of the key aspects of ${item.title}.`,
        `Important supporting information with real-world context.`,
        `Additional insights expanding on the concepts discussed.`,
        `Practical applications and implications of this topic.`,
        `Summary of key takeaways and significance.`,
      ],
      key_takeaway: `Understanding ${item.title} is crucial for this presentation.`,
    })
  }

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
    usedModel,
  })
}