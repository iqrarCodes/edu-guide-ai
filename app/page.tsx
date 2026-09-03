'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Menu, X, ArrowRight, CheckCircle, Rocket, Zap, Users, Award,
  BarChart3, BookOpen, HelpCircle, Video, FileText, Presentation,
  Sparkles, Globe, Shield, TrendingUp, Play, ExternalLink, LogOut,
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)

  // ----- Check auth status -----
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      setUser(user)
    }
    checkAuth()
  }, [])

  // ----- Fetch projects from Supabase (direct) -----
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      // Fetch ALL projects (not filtered by user_id) for landing page
      // But RLS restricts to user_id, so we'll just fetch a sample or all visible.
      // Since RLS requires auth, let's fetch projects belonging to the current user if logged in,
      // otherwise just use hardcoded sample.
      if (isLoggedIn && user) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setProjects(data)
        }
      }
      setLoading(false)
    }
    fetchProjects()
  }, [isLoggedIn, user])

  // ----- Project details (hardcoded for display) -----
  const projectDetails = {
    'Slides Generator': {
      problem: 'Creating professional presentations takes hours of manual work with repetitive formatting and design decisions.',
      solution: 'AI-powered presentation generation that creates stunning, well-structured slides in seconds based on your topic and preferences.',
      features: [
        'AI-generated outlines and content',
        'Multiple template designs',
        'Export to PPTX, PDF, and Word',
        'AI image generation for slides',
        'Real-time editing and preview',
        'Presentation analytics',
      ],
      longDescription: 'Transform your ideas into professional presentations instantly. Our AI analyzes your topic, audience, and preferred style to generate complete, visually appealing presentations with minimal effort.',
    },
    'QuizTube': {
      problem: 'Creating engaging quizzes and assessments is time-consuming, and tracking student progress manually is inefficient.',
      solution: 'AI-driven quiz generation with automated grading and detailed analytics for educators and content creators.',
      features: [
        'AI-generated quiz questions',
        'Multiple question types',
        'Automated grading',
        'Student performance analytics',
        'Export to various formats',
        'Real-time progress tracking',
      ],
      longDescription: 'Revolutionize how you create and manage quizzes. Our AI generates diverse, curriculum-aligned questions while providing comprehensive analytics to track student performance and identify learning gaps.',
    },
  }

  const getProjectDetails = (projectName: string) => {
    for (const [key, value] of Object.entries(projectDetails)) {
      if (projectName.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }
    return {
      problem: 'This AI tool solves complex problems by automating tasks that traditionally require significant manual effort.',
      solution: 'Leveraging cutting-edge AI technology to deliver intelligent, automated solutions tailored to your needs.',
      features: [
        'AI-powered automation',
        'Intelligent processing',
        'User-friendly interface',
        'Real-time results',
        'Export capabilities',
        'Analytics dashboard',
      ],
      longDescription: 'An innovative AI tool designed to streamline your workflow and deliver intelligent, automated solutions.',
    }
  }

  // ----- Stats -----
  const stats = [
    { icon: Rocket, label: 'AI Projects', value: projects.length || 0 },
    { icon: Users, label: 'Active Users', value: '500+' },
    { icon: Award, label: 'Success Rate', value: '94%' },
    { icon: Zap, label: 'Processed Tasks', value: '10K+' },
  ]

  // ----- Platform Features -----
  const platformFeatures = [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      desc: 'Create professional content, presentations, and quizzes with advanced AI models.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      desc: 'Generate complete projects in seconds, not hours. Instant results with minimal waiting.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      desc: 'Your data is encrypted and secure. We prioritize privacy and protection.',
    },
    {
      icon: Globe,
      title: 'Multi-Format Export',
      desc: 'Export to PPTX, PDF, Word, and more. Works with all major platforms.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      desc: 'Track progress, usage, and performance with detailed analytics and insights.',
    },
    {
      icon: Users,
      title: 'Collaboration Ready',
      desc: 'Share and collaborate on projects with team members and students.',
    },
  ]

  // ----- Handlers -----
  const handleGetStarted = () => router.push('/signup')
  const handleLogin = () => router.push('/login')
  const handleDashboard = () => router.push('/dashboard')
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUser(null)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                EduGuide AI+
              </span>
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                Platform
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <a href="#projects" className="text-gray-600 hover:text-purple-600 transition font-medium text-sm">Projects</a>
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition font-medium text-sm">Features</a>
              <a href="#about" className="text-gray-600 hover:text-purple-600 transition font-medium text-sm">About</a>
              {isLoggedIn ? (
                <>
                  <button onClick={handleDashboard} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition text-sm">
                    Dashboard
                  </button>
                  <button onClick={handleLogout} className="text-red-600 hover:text-red-700 transition font-medium text-sm flex items-center gap-1">
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-purple-600 transition font-medium text-sm">Log in</Link>
                  <Link href="/signup" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition text-sm">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4">
            <div className="flex flex-col gap-3">
              <a href="#projects" className="text-gray-600 hover:text-purple-600 transition font-medium">Projects</a>
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition font-medium">Features</a>
              <a href="#about" className="text-gray-600 hover:text-purple-600 transition font-medium">About</a>
              {isLoggedIn ? (
                <>
                  <button onClick={handleDashboard} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium text-center">Dashboard</button>
                  <button onClick={handleLogout} className="text-red-600 hover:text-red-700 transition font-medium text-left">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-purple-600 transition font-medium">Log in</Link>
                  <Link href="/signup" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium text-center">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">AI-Powered Suite</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">v2.0</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Your AI Companion for
              <span className="block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Smarter Learning</span>
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-lg">
              Generate professional presentations, quizzes, videos, and more in seconds. Let AI do the heavy lifting while you focus on what matters.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {isLoggedIn ? (
                <>
                  <button onClick={handleDashboard} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-xl transition flex items-center gap-2">
                    Go to Dashboard <ArrowRight size={20} />
                  </button>
                  <button onClick={handleLogout} className="bg-red-100 text-red-600 px-6 py-3 rounded-xl font-medium hover:bg-red-200 transition flex items-center gap-2">
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleGetStarted} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-xl transition flex items-center gap-2">
                    Get Started <ArrowRight size={20} />
                  </button>
                  <button onClick={handleLogin} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition">
                    Sign In
                  </button>
                </>
              )}
              <a href="#projects" className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition flex items-center gap-2">
                View Projects <ExternalLink size={18} />
              </a>
            </div>
            <div className="mt-8 grid grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-800">
                    <stat.icon size={20} className="text-purple-600" />
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-3xl opacity-20 blur-2xl" />
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-2xl" />
                  <div>
                    <p className="font-bold text-gray-800">AI Slides Generator</p>
                    <p className="text-xs text-gray-400">Created 5 mins ago</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gradient-to-r from-purple-200 to-purple-400 rounded-full w-3/4" />
                  <div className="h-3 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full w-1/2" />
                  <div className="h-3 bg-gradient-to-r from-green-200 to-green-400 rounded-full w-5/6" />
                  <div className="h-3 bg-gradient-to-r from-pink-200 to-pink-400 rounded-full w-2/3" />
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
                  <span>AI Generated</span>
                  <span>10 slides</span>
                  <span>5s</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">Ready to export</p>
                    <p className="text-[10px] text-gray-400">PPTX • PDF • Word</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800">Our AI Tools</h2>
          <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
            Explore our suite of AI-powered tools designed to make learning and content creation effortless.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">🚀</div>
            <p className="text-xl font-medium text-gray-400">No projects added yet.</p>
            <p className="text-gray-400">Add your first project from the dashboard.</p>
            <button
              onClick={isLoggedIn ? handleDashboard : handleLogin}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-purple-700 transition"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Sign in to Add'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects.map((project) => {
              const details = getProjectDetails(project.name)
              return (
                <div key={project.id} className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">📦</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{project.name}</h3>
                          <p className="text-sm text-gray-500">AI-Powered Tool</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-red-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Problem</p>
                        <p className="text-sm text-gray-700 mt-1">{details.problem}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Solution</p>
                        <p className="text-sm text-gray-700 mt-1">{details.solution}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{details.longDescription}</p>
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">✨ Key Features</p>
                      <div className="grid grid-cols-2 gap-2">
                        {details.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle size={14} className="text-purple-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={isLoggedIn ? handleDashboard : handleLogin}
                      className="w-full bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 py-2.5 rounded-xl text-sm font-medium transition border border-gray-200 hover:border-purple-300 flex items-center justify-center gap-2"
                    >
                      {isLoggedIn ? 'Explore in Dashboard' : 'Sign in to Explore'} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800">Platform Features</h2>
          <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
            Everything you need to create, manage, and share your AI-powered projects.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformFeatures.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <feature.icon size={24} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{feature.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to Transform Your Workflow?</h2>
          <p className="mt-3 text-purple-100 max-w-2xl mx-auto">
            Start using AI-powered tools to create professional presentations, quizzes, and more in seconds.
          </p>
          <button
            onClick={isLoggedIn ? handleDashboard : handleGetStarted}
            className="mt-6 bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:shadow-xl transition flex items-center gap-2 mx-auto"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Get Started'} <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg">EduGuide AI+</h3>
            <p className="text-sm mt-2">Your AI Companion for Smarter Learning and Content Creation.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Products</h4>
            <ul className="space-y-2 text-sm">
              <li>Slides Generator</li>
              <li>QuizTube</li>
              <li>AI Video Creator</li>
              <li>AI Script Writer</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>Documentation</li>
              <li>API Reference</li>
              <li>Tutorials</li>
              <li>Blog</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li>GitHub</li>
              <li>Twitter</li>
              <li>LinkedIn</li>
              <li>YouTube</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; 2026 EduGuide AI+. All rights reserved. Built with ❤️</p>
        </div>
      </footer>
    </div>
  )
}