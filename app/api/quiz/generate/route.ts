import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuiz } from '@/lib/quiz/generator'
import { getTranscript } from '@/lib/quiz/transcript'

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

  try {
    let extractedText = ''
    let sourceUrl = ''
    let sourceTypeDb = 'video'

    if (sourceType === 'video') {
      const videoUrl = formData.get('videoUrl') as string
      if (!videoUrl) {
        return NextResponse.json({ error: 'Video URL required' }, { status: 400 })
      }
      sourceUrl = videoUrl
      const transcript = await getTranscript(videoUrl)
      extractedText = transcript.text
    } else {
      const file = formData.get('file') as File
      if (!file) {
        return NextResponse.json({ error: 'File required' }, { status: 400 })
      }
      sourceTypeDb = 'file'
      sourceUrl = file.name

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = file.name.split('.').pop()?.toLowerCase() || ''

      // Dynamic imports (only when needed)
      if (ext === 'pdf') {
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } else if (ext === 'txt') {
        extractedText = buffer.toString('utf-8')
      } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) {
        const Tesseract = await import('tesseract.js')
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng')
        extractedText = text
      } else if (ext === 'pptx') {
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(buffer)
        let text = ''
        const slideFiles = Object.keys(zip.files).filter(f => f.match(/ppt\/slides\/slide\d+\.xml/))
        for (const slideFile of slideFiles) {
          const content = await zip.files[slideFile].async('text')
          const matches = content.match(/<a:t>([^<]*)<\/a:t>/g)
          if (matches) {
            text += matches.map((m: string) => m.replace(/<\/?a:t>/g, '')).join(' ') + '\n'
          }
        }
        extractedText = text
      } else {
        extractedText = buffer.toString('utf-8')
      }

      if (!extractedText || extractedText.length < 100) {
        return NextResponse.json({ error: 'Could not extract sufficient text from file' }, { status: 400 })
      }
    }

    // Generate quiz using AI – this function now uses quizGroq internally
    const quizData = await generateQuiz(extractedText, difficulty, language, numMcqs, numShortQuestions)

    // Save to quizzes table
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert([{
        user_id: user.id,
        video_url: sourceType === 'video' ? sourceUrl : null,
        file_name: sourceType === 'file' ? sourceUrl : null,
        source_type: sourceTypeDb,
        difficulty,
        language,
        summary: quizData.summary,
        mcqs: quizData.mcqs,
        short_questions: quizData.shortQuestions,
      }])
      .select()
      .single()

    if (error) throw error

    // Also add to projects table for dashboard stats
    await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        type: 'quiz',
        name: `Quiz: ${sourceType === 'video' ? 'Video' : 'File'}`,
        description: `${difficulty} - ${language} - ${new Date().toLocaleDateString()}`,
      }])

    return NextResponse.json({ success: true, quizId: quiz.id, ...quizData })
  } catch (error: any) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}