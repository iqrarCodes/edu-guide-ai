import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLessonPlan } from '@/lib/lesson-planner/generator'
import Groq from 'groq-sdk'

// ✅ Use dedicated Lesson API key
const lessonGroq = new Groq({ apiKey: process.env.GROQ_API_KEY_LESSON })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const sourceType = (formData.get('sourceType') as string) || 'topic'
  const grade = formData.get('grade') as string
  const subject = formData.get('subject') as string
  const duration = (formData.get('duration') as string) || '45 mins'

  try {
    let topic = ''
    let contentForLesson = ''

    // ========== TOPIC BASED ==========
    if (sourceType === 'topic') {
      topic = (formData.get('topic') as string) || ''

      if (!topic || !grade || !subject) {
        return NextResponse.json(
          { error: 'Topic, grade, and subject are required' },
          { status: 400 }
        )
      }
    }
    // ========== FILE BASED ==========
    else if (sourceType === 'file') {
      const file = formData.get('file') as File
      const chapter = formData.get('chapter') as string
      topic = (formData.get('topic') as string) || 'Lecture Material'

      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 })
      }
      if (!grade || !subject) {
        return NextResponse.json(
          { error: 'Grade and subject are required' },
          { status: 400 }
        )
      }

      // Extract text from file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = file.name.split('.').pop()?.toLowerCase() || ''

      let rawText = ''

      if (ext === 'pdf') {
        const pdfParse = (await import('pdf-parse' as any)).default
        const pdfData = await pdfParse(buffer)
        rawText = pdfData.text
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        rawText = result.value
      } else if (ext === 'txt') {
        rawText = buffer.toString('utf-8')
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Use PDF, DOCX, or TXT' },
          { status: 400 }
        )
      }

      if (!rawText || rawText.length < 100) {
        return NextResponse.json(
          { error: 'Could not extract sufficient content from file' },
          { status: 400 }
        )
      }

      console.log(`📄 Extracted ${rawText.length} chars from ${file.name}`)

      // Extract specific chapter if requested (using LESSON API key)
      if (chapter && rawText.length > 3000) {
        console.log(`📖 Extracting chapter: ${chapter}`)
        const chapterPrompt = `
Extract ONLY the content related to "${chapter}" from the following lecture text.
If "${chapter}" is not found, return the most relevant educational content (1000-2000 words).

Text:
${rawText.slice(0, 15000)}

Output ONLY the extracted content. No explanation, no markdown.
`
        try {
          const chapterResponse = await lessonGroq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [{ role: 'user', content: chapterPrompt }],
            temperature: 0.1,
            max_tokens: 3000,
          })
          const extracted = chapterResponse.choices[0].message.content || ''
          if (extracted.length > 200) {
            rawText = extracted
            console.log(`✅ Chapter extracted: ${extracted.length} chars`)
          }
        } catch (e) {
          console.warn('Chapter extraction failed, using full text')
        }
      }

      contentForLesson = rawText.slice(0, 6000)
    } else {
      return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
    }

    // ========== GENERATE LESSON PLAN ==========
    let lessonPlan: any

    if (sourceType === 'topic') {
      // Use existing generator for topic-based
      lessonPlan = await generateLessonPlan(topic, grade, subject, duration)
    } else {
      // For file-based, call AI directly with the extracted content
      lessonPlan = await generateFromContent(
        contentForLesson,
        topic,
        grade,
        subject,
        duration
      )
    }

    // ========== SAVE TO SUPABASE ==========
    const { data, error } = await supabase
      .from('lesson_plans')
      .insert([{
        user_id: user.id,
        topic: lessonPlan.topic || topic,
        grade: lessonPlan.grade || grade,
        subject: lessonPlan.subject || subject,
        duration: lessonPlan.duration || duration,
        objectives: lessonPlan.objectives || [],
        activities: lessonPlan.activities || [],
        assessments: lessonPlan.assessments || [],
        homework: lessonPlan.homework || '',
        materials: lessonPlan.materials || [],
        teacher_notes: lessonPlan.teacher_notes || '',
      }])
      .select()
      .single()

    if (error) {
      console.error('Save error:', error)
      throw new Error('Failed to save lesson plan')
    }

    // Also add to projects table
    await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        type: 'lesson_plan',
        name: `Lesson: ${lessonPlan.topic || topic}`,
        description: `${subject} • ${grade}`,
      }])

    return NextResponse.json({
      success: true,
      lessonPlanId: data.id,
      ...lessonPlan,
    })

  } catch (error: any) {
    console.error('Lesson plan generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    )
  }
}

// ============================================================
// FILE-BASED LESSON PLAN GENERATOR
// ============================================================
async function generateFromContent(
  content: string,
  topic: string,
  grade: string,
  subject: string,
  duration: string
) {
  const prompt = `You are an expert teacher. Analyze the following lecture content and create a comprehensive lesson plan.

═══ LECTURE CONTENT ═══
${content}
═══ END CONTENT ═══

Grade: ${grade}
Subject: ${subject}
Duration: ${duration}
Topic: ${topic}

Create a detailed lesson plan based on the KEY concepts from this content.

Return ONLY valid JSON with this structure:
{
  "topic": "${topic}",
  "grade": "${grade}",
  "subject": "${subject}",
  "duration": "${duration}",
  "objectives": [
    "Students will be able to... (4-5 specific, measurable outcomes)"
  ],
  "activities": [
    {
      "title": "Activity name",
      "description": "Detailed 20-30 word description",
      "duration": "10 mins",
      "type": "individual" | "group" | "class"
    }
  ],
  "assessments": [
    {
      "type": "formative" | "summative",
      "description": "How you will assess understanding"
    }
  ],
  "homework": "Detailed homework description",
  "materials": ["Material 1", "Material 2"],
  "teacher_notes": "Important tips for the teacher"
}

Rules:
- 4-5 objectives
- 4-5 activities with detailed descriptions
- 2-3 assessments
- 4-6 materials
- Return ONLY JSON, no markdown, no explanation`

  const models = [
    { name: 'openai/gpt-oss-120b', maxTokens: 4000 },
    { name: 'openai/gpt-oss-20b', maxTokens: 4000 },
    { name: 'qwen/qwen3.6-27b', maxTokens: 4000 },
  ]

  let raw = ''
  for (const model of models) {
    try {
      console.log(`🔄 Trying ${model.name}...`)
      const response = await lessonGroq.chat.completions.create({
        model: model.name,
        messages: [
          {
            role: 'system',
            content: 'You are an expert teacher. Return ONLY valid JSON. No markdown, no explanations.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: model.maxTokens,
      })
      raw = response.choices[0].message.content || ''
      if (raw && raw.trim().length > 200) {
        console.log(`✅ ${model.name} returned ${raw.length} chars`)
        break
      }
    } catch (error: any) {
      console.error(`❌ ${model.name} error:`, error.message)
    }
  }

  // Parse
  try {
    let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/`/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    return JSON.parse(match[0])
  } catch (e) {
    console.error('Parse error:', e)
    // Fallback
    return {
      topic,
      grade,
      subject,
      duration,
      objectives: [
        `Students will understand key concepts from the lecture content`,
        `Students will be able to explain the main ideas clearly`,
        `Students will apply the concepts to real-world scenarios`,
        `Students will demonstrate understanding through assessment`,
      ],
      activities: [
        { title: 'Introduction', description: 'Introduce the topic and outline learning objectives.', duration: '5 mins', type: 'class' },
        { title: 'Content Review', description: 'Review the key concepts from the lecture material.', duration: '15 mins', type: 'class' },
        { title: 'Guided Practice', description: 'Work through examples together as a class.', duration: '10 mins', type: 'group' },
        { title: 'Independent Practice', description: 'Students work on problems individually.', duration: '10 mins', type: 'individual' },
        { title: 'Wrap-up', description: 'Summarize key takeaways and answer questions.', duration: '5 mins', type: 'class' },
      ],
      assessments: [
        { type: 'formative', description: 'Monitor participation and understanding during activities' },
        { type: 'summative', description: 'End-of-lesson quiz on key concepts' },
      ],
      homework: 'Complete the practice problems related to the lecture content',
      materials: ['Whiteboard', 'Lecture notes', 'Worksheets', 'Projector'],
      teacher_notes: 'Focus on student engagement and check for understanding frequently.',
    }
  }
}