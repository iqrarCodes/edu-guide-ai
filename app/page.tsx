'use client'

import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  FileText,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Users,
  GraduationCap,
  Briefcase,
  User,
  CheckCircle,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

// ============================================================
// MAIN LANDING PAGE
// ============================================================
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Refs for scroll animations
  const heroRef = useRef<HTMLElement>(null)
  const toolsRef = useRef<HTMLElement>(null)
  const processRef = useRef<HTMLElement>(null)
  const useCasesRef = useRef<HTMLElement>(null)

  // Hero scroll effects
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.05])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  // Process section – highlight active step
  const processInView = useInView(processRef, { once: false, amount: 0.3 })

  // ============================================================
  // TOOLS DATA
  // ============================================================
  const tools = [
    {
      id: 'slides',
      icon: FileText,
      name: 'Slides Generator',
      desc: 'AI-powered presentation creation with stunning templates and auto-generated content.',
      color: 'from-purple-500 to-indigo-500',
      bg: 'from-purple-50 to-indigo-50',
      features: ['AI outlines', 'Multiple templates', 'Export PPTX/DOCX', 'Real-time preview'],
      path: '/slides',
    },
    {
      id: 'quiz',
      icon: HelpCircle,
      name: 'Quiz Generator',
      desc: 'Create engaging quizzes with AI-generated questions and automated grading.',
      color: 'from-pink-500 to-rose-500',
      bg: 'from-pink-50 to-rose-50',
      features: ['AI questions', 'Multiple formats', 'Auto-grading', 'Analytics'],
      path: '/quiz',
    },
    {
      id: 'lesson',
      icon: BookOpen,
      name: 'Lesson Planner',
      desc: 'Plan structured lessons with AI-suggested activities, objectives, and assessments.',
      color: 'from-emerald-500 to-teal-500',
      bg: 'from-emerald-50 to-teal-50',
      features: ['Lesson objectives', 'Activities', 'Assessments', 'Standards alignment'],
      path: '/lesson-planner',
    },
    {
      id: 'chatbot',
      icon: MessageSquare,
      name: 'AI Chatbot',
      desc: 'Intelligent conversational AI for instant answers, tutoring, and student support.',
      color: 'from-amber-500 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      features: ['24/7 availability', 'Tutoring', 'Quick answers', 'Multi-lingual'],
      path: '/chat',
    },
  ]

  // ============================================================
  // PROCESS STEPS
  // ============================================================
  const steps = [
    {
      number: '01',
      title: 'Define Your Goal',
      desc: 'Tell us what you want to create – a presentation, quiz, lesson plan, or get AI assistance.',
    },
    {
      number: '02',
      title: 'AI Generates Content',
      desc: 'Our advanced AI models generate professional, high-quality content tailored to your needs.',
    },
    {
      number: '03',
      title: 'Review & Export',
      desc: 'Customize, refine, and export your content in your preferred format – ready to use.',
    },
  ]

  // ============================================================
  // USE CASES
  // ============================================================
  const useCases = [
    {
      icon: GraduationCap,
      title: 'For Teachers',
      desc: 'Save hours of planning time. Generate lesson plans, quizzes, and presentations instantly.',
    },
    {
      icon: Users,
      title: 'For Students',
      desc: 'Learn smarter with AI-generated study materials, quizzes, and instant tutoring.',
    },
    {
      icon: Briefcase,
      title: 'For Professionals',
      desc: 'Create professional presentations and training materials in minutes, not hours.',
    },
    {
      icon: User,
      title: 'For Content Creators',
      desc: 'Generate engaging educational content at scale with AI-powered assistance.',
    },
  ]

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                EduGuide AI+
              </Link>
              <span className="hidden sm:inline text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30">
                Platform
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#tools" className="text-gray-400 hover:text-white transition text-sm">Tools</a>
              <a href="#process" className="text-gray-400 hover:text-white transition text-sm">How It Works</a>
              <a href="#use-cases" className="text-gray-400 hover:text-white transition text-sm">Use Cases</a>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition text-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A0A0F] border-b border-white/5 px-4 py-4">
            <div className="flex flex-col gap-3">
              <a href="#tools" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition">Tools</a>
              <a href="#process" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition">How It Works</a>
              <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition">Use Cases</a>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2 rounded-xl font-medium text-center">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-4 pt-20"
      >
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-6"
          >
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-sm text-gray-300">AI-Powered Learning Suite</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight"
          >
            Your AI Companion for
            <span className="block bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-[shimmer_3s_ease-in-out_infinite]">
              Smarter Learning
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Generate professional presentations, quizzes, lesson plans, and get AI assistance – all in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition flex items-center gap-2 group"
            >
              Get Started
              <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </Link>
            <a
              href="#tools"
              className="bg-white/5 border border-white/10 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-white/10 transition"
            >
              Explore Tools
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white">4</p>
              <p className="text-xs text-gray-400">AI Tools</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs text-gray-400">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">94%</p>
              <p className="text-xs text-gray-400">Satisfaction</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== TOOLS SECTION (Sticky 2-Column) ===== */}
      <section
        ref={toolsRef}
        id="tools"
        className="relative min-h-[200vh] px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left – Sticky Image */}
          <div className="relative lg:sticky lg:top-0 lg:h-screen flex items-center">
            <div className="w-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-3xl p-8 border border-white/10 backdrop-blur-sm h-[400px] lg:h-[500px] flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">4 Powerful AI Tools</h3>
                <p className="text-gray-400 mt-2 max-w-xs mx-auto">
                  One platform. Infinite possibilities for education and content creation.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  {tools.map((tool) => (
                    <span key={tool.id} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-gray-300">
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right – Tool Cards */}
          <div className="space-y-8 py-8 lg:py-16">
            {tools.map((tool, idx) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: false, amount: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${tool.color} flex items-center justify-center flex-shrink-0`}>
                    <tool.icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white group-hover:text-purple-400 transition">
                      {tool.name}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">{tool.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tool.features.map((feature) => (
                        <span key={feature} className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-gray-400">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={tool.path}
                      className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition mt-3"
                    >
                      Explore <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROCESS SECTION ===== */}
      <section
        ref={processRef}
        id="process"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: false, amount: 0.3 }}
            className="text-center mb-16"
          >
            <span className="text-purple-400 text-sm font-medium uppercase tracking-wider">Process</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-2">How It Works</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
              Three simple steps to create professional educational content with AI.
            </p>
          </motion.div>

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const ref = useRef(null)
              const isInView = useInView(ref, { once: false, amount: 0.5 })

              return (
                <motion.div
                  key={idx}
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className={`p-6 rounded-2xl border transition-all ${
                    isInView
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <span className="text-4xl font-bold text-purple-400/30 flex-shrink-0">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{step.title}</h3>
                      <p className="text-gray-400 mt-1">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== USE CASES SECTION ===== */}
      <section
        ref={useCasesRef}
        id="use-cases"
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: false, amount: 0.3 }}
            className="text-center mb-16"
          >
            <span className="text-purple-400 text-sm font-medium uppercase tracking-wider">Who It's For</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-2">Use Cases</h2>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
              From teachers to content creators – EduGuide AI+ empowers everyone.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: false, amount: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-purple-500/50 transition group"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <item.icon size={28} className="text-purple-400" />
                </div>
                <h4 className="text-lg font-bold text-white">{item.title}</h4>
                <p className="text-gray-400 text-sm mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: false, amount: 0.3 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-purple-100 mt-3 max-w-2xl mx-auto">
              Start using AI-powered tools to create professional content in seconds.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 mt-6 bg-white text-purple-600 px-8 py-3.5 rounded-xl font-semibold hover:shadow-xl transition group"
            >
              Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== REVEAL FOOTER – CLICKABLE LINKS ===== */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: false, amount: 0.2 }}
        className="bg-[#05050A] border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                EduGuide AI+
              </h3>
              <p className="text-gray-500 text-sm mt-2">Your AI Companion for Smarter Learning.</p>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-white font-semibold mb-3">Tools</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/slides" className="text-gray-500 hover:text-white transition">Slides Generator</Link></li>
                <li><Link href="/quiz" className="text-gray-500 hover:text-white transition">Quiz Generator</Link></li>
                <li><Link href="/lesson-planner" className="text-gray-500 hover:text-white transition">Lesson Planner</Link></li>
                <li><Link href="/chat" className="text-gray-500 hover:text-white transition">AI Chatbot</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="text-gray-500 hover:text-white transition">Documentation</Link></li>
                <li><Link href="/api-reference" className="text-gray-500 hover:text-white transition">API Reference</Link></li>
                <li><Link href="/blog" className="text-gray-500 hover:text-white transition">Blog</Link></li>
                <li><Link href="/tutorials" className="text-gray-500 hover:text-white transition">Tutorials</Link></li>
              </ul>
            </div>

            {/* Connect (Social) */}
            <div>
              <h4 className="text-white font-semibold mb-3">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition">
                    YouTube
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} EduGuide AI+. All rights reserved. Built with ❤️</p>
          </div>
        </div>
      </motion.footer>

      {/* Shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}