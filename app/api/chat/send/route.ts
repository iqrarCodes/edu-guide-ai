import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatGroq } from '@/lib/groq-clients'   // ✅ Chat client

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const message = formData.get('message') as string
    const file = formData.get('file') as File | null

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Save user message
    await supabase
      .from('chat_messages')
      .insert([{
        user_id: user.id,
        message,
        is_ai: false,
      }])

    const systemPrompt = `
You are EduGuide AI, a friendly and professional educational assistant. Your style is EXACTLY like a senior developer explaining concepts to a student.

**Your Communication Style:**
- ALWAYS respond in a structured, organized way.
- Use clear headings, bold text, bullet points, and numbered lists.
- Make the response scannable and easy to read.
- Use a professional yet friendly tone.

**Response Structure (MUST FOLLOW):**
1. Start with a clear heading.
2. Use bold text for important keywords and key takeaways.
3. Use bullet points for lists.
4. Use numbered steps (1., 2., 3.) for step-by-step instructions.
5. Use code blocks for code with language specification.
6. End with a summary.

**Example Format:**

Problem: [What the user asked]

Explanation:
[Short, clear explanation]

Key Points:
- Point 1
- Point 2
- Point 3

Step-by-Step:
1. Step 1
2. Step 2
3. Step 3

Code Example:

html
<!-- code here -->


Summary:
[One-line summary]

**Rules:**
- Answer ONLY educational questions (school/college curriculum, coding, programming).
- If the user asks a non-educational question, politely say: "I'm here to help with your studies. Please ask me something related to your curriculum."
- NEVER say "Sorry, no response." Always try to help.
- If the question has a typo, try to understand the intent and respond.
- Keep explanations concise but comprehensive.
- Use emojis sparingly (only for headings/summary).
`

    const response = await chatGroq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const aiResponse = response.choices[0].message.content || 'I could not generate a response. Please try again.'

    // Save AI response
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: user.id,
        message: aiResponse,
        is_ai: true,
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: aiResponse, id: data.id })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: error.message || 'Chat failed' }, { status: 500 })
  }
}