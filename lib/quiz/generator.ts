import { quizGroq } from '@/lib/groq-clients'   // ✅ Quiz client

function safeParseJSON(content: string) {
    let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}') + 1
    if (start === -1 || end === 0) throw new Error('No JSON object found.')
    cleaned = cleaned.substring(start, end)
    let fixed = cleaned
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']')
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
    try { return JSON.parse(fixed) } catch (e) {
        try { return JSON.parse(fixed) } catch (e2) {
            const match = fixed.match(/\{[\s\S]*\}/)
            if (match) {
                try { return JSON.parse(match[0]) } catch (e3) { throw new Error('Could not parse JSON.') }
            }
            throw new Error('No valid JSON found.')
        }
    }
}

function generateFallbackQuiz(text: string, numMcqs: number, numShortQuestions: number) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const fallback: any = {
        summary: ['Content summary generated from the provided text.'],
        mcqs: [],
        shortQuestions: []
    }

    for (let i = 0; i < Math.min(numMcqs, sentences.length); i++) {
        const s = sentences[i].trim()
        fallback.mcqs.push({
            question: `What is the main idea of: "${s.substring(0, 60)}..."?`,
            options: ['A) The main idea', 'B) A supporting detail', 'C) An example', 'D) A conclusion'],
            correct: 'A) The main idea',
            explanation: 'This is the main point of the sentence.'
        })
    }

    for (let i = 0; i < Math.min(numShortQuestions, sentences.length); i++) {
        const s = sentences[(i + numMcqs) % sentences.length].trim()
        const words = s.split(' ').filter(w => w.length > 3).slice(0, 3)
        fallback.shortQuestions.push({
            question: `Explain: "${s.substring(0, 60)}..."`,
            expected_keywords: words.length > 0 ? words : ['concept', 'explanation']
        })
    }

    while (fallback.mcqs.length < numMcqs) {
        fallback.mcqs.push({
            question: 'What is the key concept discussed?',
            options: ['A) Concept A', 'B) Concept B', 'C) Concept C', 'D) Concept D'],
            correct: 'A) Concept A',
            explanation: 'This is a placeholder.'
        })
    }
    while (fallback.shortQuestions.length < numShortQuestions) {
        fallback.shortQuestions.push({
            question: 'What is the main idea discussed?',
            expected_keywords: ['main idea', 'concept']
        })
    }

    return fallback
}

export async function generateQuiz(
    transcriptText: string,
    difficulty: string = 'Medium',
    language: string = 'English',
    numMcqs: number = 5,
    numShortQuestions: number = 3
) {
    const text = transcriptText.slice(0, 5000)

    const prompt = `
You are an expert quiz creator. Based on the text below, generate:
- A summary (5-10 bullet points) in English
- Exactly ${numMcqs} multiple-choice questions (4 options each) in English
- Exactly ${numShortQuestions} short-answer questions in English

**Important:** All questions, options, and explanations must be in English only.
**Questions must test understanding, not recall.**
**Difficulty:** ${difficulty}

Text:
${text}

Output ONLY valid JSON with this exact structure:
{
  "summary": ["point1", "point2", ...],
  "mcqs": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A) ...",
      "explanation": "..."
    }
  ],
  "shortQuestions": [
    {
      "question": "...",
      "expected_keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`

    const modelsToTry = [
        { model: 'qwen/qwen3.6-27b', useJsonMode: true },
        { model: 'openai/gpt-oss-20b', useJsonMode: true },
    ]

    for (const { model, useJsonMode } of modelsToTry) {
        try {
            const response = await quizGroq.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a JSON generator. Your response must be ONLY a valid JSON object. No markdown, no explanations, no extra text. All output must be in English.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 4000,
                ...(useJsonMode && { response_format: { type: 'json_object' } })
            })

            const raw = response.choices[0].message.content || ''
            console.log('RAW AI RESPONSE (first 300 chars):', raw.substring(0, 300))

            const quizData = safeParseJSON(raw)

            quizData.summary = Array.isArray(quizData.summary) ? quizData.summary : ['Summary not available.']
            quizData.mcqs = Array.isArray(quizData.mcqs) ? quizData.mcqs : []
            quizData.shortQuestions = Array.isArray(quizData.shortQuestions) ? quizData.shortQuestions : []

            quizData.mcqs = quizData.mcqs.map((q: any, i: number) => ({
                question: q.question || `Question ${i + 1}`,
                options: (q.options && q.options.length === 4) ? q.options : ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
                correct: q.correct || 'A) Option 1',
                explanation: q.explanation || 'Explanation not provided.'
            }))

            quizData.shortQuestions = quizData.shortQuestions.map((q: any, i: number) => ({
                question: q.question || `Short question ${i + 1}`,
                expected_keywords: (q.expected_keywords && q.expected_keywords.length > 0) ? q.expected_keywords : ['keyword1', 'keyword2']
            }))

            while (quizData.mcqs.length < numMcqs) {
                quizData.mcqs.push({
                    question: `Sample MCQ ${quizData.mcqs.length + 1}`,
                    options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
                    correct: 'A) Option 1',
                    explanation: 'Sample explanation.'
                })
            }
            quizData.mcqs = quizData.mcqs.slice(0, numMcqs)

            while (quizData.shortQuestions.length < numShortQuestions) {
                quizData.shortQuestions.push({
                    question: `Sample short question ${quizData.shortQuestions.length + 1}`,
                    expected_keywords: ['keyword1', 'keyword2']
                })
            }
            quizData.shortQuestions = quizData.shortQuestions.slice(0, numShortQuestions)

            if (quizData.mcqs.length === 0) throw new Error('No MCQs generated.')

            const hasPlaceholder = quizData.mcqs.some((q: any) => q.question.startsWith('Sample MCQ'))
            if (hasPlaceholder) {
                console.warn('AI returned placeholders, using fallback.')
                return generateFallbackQuiz(text, numMcqs, numShortQuestions)
            }

            return quizData

        } catch (err: any) {
            console.warn(`Model ${model} failed:`, err.message)
        }
    }

    console.warn('All AI models failed. Using fallback quiz generator.')
    return generateFallbackQuiz(text, numMcqs, numShortQuestions)
}