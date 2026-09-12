import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

// ✅ Dedicated Outline API key
const outlineGroq = new Groq({ apiKey: process.env.GROQ_API_KEY_OUTLINE })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { project_id, topic, audience, mode, numSections = 8 } = body

  if (!topic) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const prompt = `You are an expert presentation strategist. Create a UNIQUE, topic-specific outline for a presentation on "${topic}".

AUDIENCE: ${audience || 'General'}
MODE: ${mode || 'Educational'}
TOTAL SECTIONS NEEDED: ${numSections}

═══════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════

RULE 1: DO NOT use generic section titles like:
  ❌ "Introduction"
  ❌ "Key Concepts"
  ❌ "Challenges"
  ❌ "Conclusion"
  ❌ "Future Outlook"

RULE 2: Each section title MUST be SPECIFIC to "${topic}". 
Instead of "Key Concepts", write "Neural Network Architectures in Deep Learning".
Instead of "Challenges", write "Data Privacy Regulations Impacting AI Adoption".

RULE 3: Analyze the topic deeply. Think about:
  - What SPECIFIC aspects does this topic have?
  - What subtopics are unique to it?
  - What questions would an expert audience ask?

RULE 4: Each section MUST have a UNIQUE angle. No repetition.

RULE 5: Section titles should be 4-10 words (specific, informative).
   Descriptions should be 25-40 words explaining the specific focus.

═══════════════════════════════════════════════════
EXAMPLE (for topic "AI in Education 2026")
═══════════════════════════════════════════════════

[
  {"title": "Current AI Adoption in Classrooms", "description": "Analyzing the present state of AI integration in K-12 and higher education, including adoption statistics, common tools used, and regional differences in implementation."},
  {"title": "Adaptive Learning Algorithms", "description": "Exploring how AI personalizes curriculum pacing, identifies knowledge gaps, and adjusts difficulty levels in real time based on student performance patterns."},
  {"title": "Teacher Support Through AI Tools", "description": "Examining how AI assists educators with lesson planning, automated grading, and student analytics, freeing time for high-value interactions."},
  {"title": "Student Data Privacy Concerns", "description": "Understanding regulatory frameworks like FERPA, GDPR, and emerging AI-specific laws that govern how student data is collected, stored, and used."},
  {"title": "Equity and Access Challenges", "description": "Investigating the digital divide, algorithmic bias, and how AI might widen or narrow educational gaps between different socioeconomic groups."},
  {"title": "Predictions for 2027-2030", "description": "Forecasting emerging AI technologies, potential paradigm shifts, and the trajectory of AI adoption in global education systems."}
]

═══════════════════════════════════════════════════
NOW GENERATE ${numSections} UNIQUE SECTIONS FOR "${topic}"
═══════════════════════════════════════════════════

Return ONLY a valid JSON array. NO markdown, NO code fences, NO explanations.
Format: [{"title": "...", "description": "..."}, ...]`

  try {
    const response = await outlineGroq.chat.completions.create({
      model: 'openai/gpt-oss-120b',   // Better for planning
      messages: [
        {
          role: 'system',
          content: 'You are an expert presentation strategist. Return ONLY valid JSON arrays. No markdown. Be specific and unique.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    })

    const raw = response.choices[0].message.content || ''
    console.log('📋 Outline response:', raw.substring(0, 200))

    let outline: any[] = []
    try {
      let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/`/g, '').trim()
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) {
        outline = JSON.parse(match[0])
      }
    } catch (e) {
      console.error('Outline parse error:', e)
    }

    // Fallback
    if (!outline || outline.length === 0) {
      outline = [
        { title: `Understanding ${topic}`, description: `Core concepts and foundational knowledge about ${topic}.` },
        { title: `Key Components of ${topic}`, description: `Detailed breakdown of the main elements that define ${topic}.` },
        { title: `Applications and Use Cases`, description: `Real-world applications and practical use cases of ${topic}.` },
        { title: `Challenges and Limitations`, description: `Common obstacles, limitations, and how they are being addressed.` },
        { title: `Best Practices`, description: `Industry best practices and recommended approaches for ${topic}.` },
        { title: `Future Trends`, description: `Emerging trends and future directions in ${topic}.` },
      ]
    }

    // Normalize
    outline = outline.map((item: any, idx: number) => ({
      title: String(item.title || `Section ${idx + 1}`).slice(0, 100),
      description: String(item.description || '').slice(0, 300),
    }))

    // Save to DB (so it persists)
    if (project_id) {
      await supabase
        .from('slides_data')
        .update({ outline })
        .eq('project_id', project_id)
    }

    return NextResponse.json({ outline })
  } catch (error: any) {
    console.error('Outline generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}