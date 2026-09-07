import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuiz } from '@/lib/quiz/generator'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_QUIZ })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const sourceType = formData.get('sourceType') as string
  const difficulty = (formData.get('difficulty') as string) || 'Medium'
  const language = (formData.get('language') as string) || 'English'
  const numMcqs = parseInt(formData.get('numMcqs') as string) || 5
  const numShortQuestions = parseInt(formData.get('numShortQuestions') as string) || 3

  console.log(`📝 Quiz request: source=${sourceType}, lang=${language}, diff=${difficulty}`)

  let extractedText = ''
  let sourceUrl = ''
  let sourceTypeDb = sourceType

  try {
    // ========== 1. TOPIC-BASED ==========
    if (sourceType === 'topic') {
      const topic = formData.get('topic') as string
      const subtopics = (formData.get('subtopics') as string) || ''

      if (!topic) {
        return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
      }

      console.log(`📚 Generating content for topic: ${topic}`)
      sourceUrl = topic

      const contentPrompt = `
You are an expert educator. Generate a comprehensive, well-structured lesson summary (500-800 words) on the topic: "${topic}"${subtopics ? ` with focus on: ${subtopics}` : ''}.
The content should be educational, clear, and suitable for generating a quiz.
Include key concepts, definitions, examples, and important distinctions.
`

      const contentResponse = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: contentPrompt }],
        temperature: 0.5,
        max_tokens: 2000,
      })

      extractedText = contentResponse.choices[0].message.content || ''
      if (!extractedText || extractedText.length < 200) {
        throw new Error('Failed to generate content for this topic.')
      }
      console.log(`✅ Topic content generated (${extractedText.length} chars)`)
    }

    // ========== 2. FILE UPLOAD (with Chapter Extraction) ==========
    else if (sourceType === 'file') {
      const file = formData.get('file') as File
      if (!file) {
        return NextResponse.json({ error: 'File required' }, { status: 400 })
      }
      sourceUrl = file.name
      sourceTypeDb = 'file'

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = file.name.split('.').pop()?.toLowerCase() || ''

      if (ext === 'pdf') {
        const pdfParse = (await import('pdf-parse' as any)).default
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } else if (ext === 'txt') {
        extractedText = buffer.toString('utf-8')
      } else {
        extractedText = buffer.toString('utf-8')
      }

      if (!extractedText || extractedText.length < 100) {
        return NextResponse.json({ error: 'Could not extract sufficient text from file' }, { status: 400 })
      }

      console.log(`📄 File extracted (${extractedText.length} chars)`)

      const chapter = formData.get('chapter') as string
      if (chapter && extractedText.length > 0) {
        console.log(`📖 Extracting chapter: ${chapter}`)
        const chapterPrompt = `
You are a text extraction assistant. Given the following text from a book/document, extract ONLY the content related to "${chapter}".

Rules:
1. If "${chapter}" is mentioned as a heading (e.g., "Chapter 4", "4.", "Section 4", "Page 50"), extract all text under that heading until the next major heading.
2. If the chapter is not explicitly found, return the most relevant section of text (500-1000 words) that best matches "${chapter}".
3. Keep the extracted content clean and readable.

Text:
${extractedText.slice(0, 8000)}

Output ONLY the extracted content.
`
        try {
          const extractResponse = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [{ role: 'user', content: chapterPrompt }],
            temperature: 0.1,
            max_tokens: 3000,
          })

          const extractedChapter = extractResponse.choices[0].message.content || ''
          if (extractedChapter.length > 100 && !extractedChapter.toLowerCase().includes('not found')) {
            extractedText = extractedChapter
            console.log(`✅ Chapter extracted (${extractedText.length} chars)`)
          } else {
            console.warn(`⚠️ Chapter "${chapter}" not found. Using full text (truncated).`)
            extractedText = extractedText.slice(0, 5000)
          }
        } catch (err: any) {
          console.warn('⚠️ Chapter extraction failed:', err.message)
          extractedText = extractedText.slice(0, 5000)
        }
      } else {
        extractedText = extractedText.slice(0, 5000)
      }
    }

    // ========== 3. UNKNOWN SOURCE ==========
    else {
      return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
    }

    // ========== 4. FINAL CHECK ==========
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No content extracted. Please try a different source.')
    }

    // --- Generate Quiz ---
    const quizData = await generateQuiz(
      extractedText,
      difficulty,
      language,
      numMcqs,
      numShortQuestions
    )

    // --- Save to Supabase ---
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert([{
        user_id: user.id,
        source_type: sourceTypeDb,
        source_url: sourceUrl,
        difficulty,
        language,
        summary: quizData.summary,
        mcqs: quizData.mcqs,
        short_questions: quizData.shortQuestions,
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase insert error:', error)
      throw new Error('Failed to save quiz to database')
    }

    // --- Add to projects ---
    const projectName = `Quiz: ${sourceType === 'topic' ? 'Topic' : 'File'}`
    await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        type: 'quiz',
        name: projectName,
        description: `${difficulty} - ${language} - ${new Date().toLocaleDateString()}`,
      }])

    console.log(`✅ Quiz saved: ${quiz.id}`)

    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      ...quizData,
    })

  } catch (error: any) {
    console.error('🔥 Quiz generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    )
  }
}