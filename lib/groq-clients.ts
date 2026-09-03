import Groq from 'groq-sdk';

// ----- Slides Generator Client -----
export const slidesGroq = new Groq({
  apiKey: process.env.GROQ_API_KEY_SLIDES,
});

// ----- Quiz Generator Client -----
export const quizGroq = new Groq({
  apiKey: process.env.GROQ_API_KEY_QUIZ,
});

// ----- Lesson Planner Client -----
export const lessonPlannerGroq = new Groq({
  apiKey: process.env.GROQ_API_KEY_LESSON,
});

// ----- AI Chatbot Client -----
export const chatGroq = new Groq({
  apiKey: process.env.GROQ_API_KEY_CHAT,
});