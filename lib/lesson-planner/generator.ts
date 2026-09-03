import { lessonPlannerGroq } from '@/lib/groq-clients'   // ✅ Lesson Planner client

export async function generateLessonPlan(
  topic: string,
  grade: string,
  subject: string,
  duration: string
) {
  const prompt = `
You are an expert curriculum designer. Create a detailed lesson plan for "${topic}" for ${grade} students in ${subject} class, duration: ${duration}.

Return ONLY a valid JSON object with this exact structure:
{
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "activities": [
    {
      "title": "Activity 1",
      "description": "Detailed description",
      "type": "individual" | "group" | "whole-class",
      "duration": "10 mins"
    }
  ],
  "assessments": [
    {
      "type": "formative" | "summative",
      "description": "Assessment description"
    }
  ],
  "homework": "Homework description",
  "materials": ["Material 1", "Material 2"],
  "teacher_notes": "Teacher notes and tips"
}
`

  try {
    const response = await lessonPlannerGroq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON generator. Return ONLY a valid JSON object. No markdown, no explanations.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 3000,
    })

    const raw = response.choices[0].message.content || ''
    console.log('📝 RAW LESSON PLAN:', raw.substring(0, 300))

    // Parse JSON
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}') + 1
    const jsonStr = cleaned.substring(start, end)
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('Lesson plan generation error:', error)
    // Fallback
    return {
      objectives: [`Understand the basics of ${topic}`, `Apply ${topic} concepts`, `Analyze ${topic} applications`],
      activities: [
        { title: 'Introduction', description: `Introduction to ${topic}`, type: 'whole-class', duration: '10 mins' },
        { title: 'Group Activity', description: `Group discussion on ${topic}`, type: 'group', duration: '15 mins' },
      ],
      assessments: [
        { type: 'formative', description: `Quiz on ${topic} basics` },
        { type: 'summative', description: `Final test on ${topic}` },
      ],
      homework: `Research and write about ${topic}`,
      materials: ['Whiteboard', 'Projector', 'Worksheets'],
      teacher_notes: `Focus on key concepts of ${topic}`,
    }
  }
}