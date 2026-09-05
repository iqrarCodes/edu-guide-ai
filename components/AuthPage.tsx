'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Mail, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface AuthPageProps {
  mode: 'login' | 'signup'
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')

  const router = useRouter()
  const supabase = createClient()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleForm = (showLogin: boolean) => {
    setIsLogin(showLogin)
    setError('')
  }

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error
      toast.success('Welcome back! 🎉')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: { name: regName },
        },
      })
      if (error) throw error
      toast.success('Account created! 🎉')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Signup failed')
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth
  const handleGoogleAuth = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })
    } catch (err: any) {
      toast.error('Google authentication failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] px-4 py-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F1A] via-[#1A1A2E] to-[#2D1B4E] opacity-50" />
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] bg-[#7C3AED]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-[#6366F1]/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md bg-[#1A1A2E] border border-[#7C3AED]/30 rounded-2xl shadow-[0_0_25px_rgba(124,58,237,0.15)] overflow-hidden z-10">
        {/* ===== MOBILE LAYOUT ===== */}
        <div className="p-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-white/80 text-sm font-medium bg-white/10 px-4 py-1.5 rounded-full mb-3">
              <Sparkles className="w-4 h-4" />
              EduGuide AI+
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {isLogin ? 'Sign in to continue' : 'Start your AI-powered learning journey'}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => toggleForm(true)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
                isLogin ? 'bg-[#7C3AED] text-white shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => toggleForm(false)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
                !isLogin ? 'bg-[#7C3AED] text-white shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          {isLogin ? (
            <LoginForm
              email={loginEmail}
              setEmail={setLoginEmail}
              password={loginPassword}
              setPassword={setLoginPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              error={error}
              loading={loading}
              onSubmit={handleLogin}
              onGoogle={handleGoogleAuth}
            />
          ) : (
            <RegisterForm
              name={regName}
              setName={setRegName}
              email={regEmail}
              setEmail={setRegEmail}
              password={regPassword}
              setPassword={setRegPassword}
              confirmPassword={regConfirmPassword}
              setConfirmPassword={setRegConfirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              error={error}
              loading={loading}
              onSubmit={handleRegister}
              onGoogle={handleGoogleAuth}
              onToggle={() => toggleForm(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Login Form Component =====
function LoginForm({ email, setEmail, password, setPassword, showPassword, setShowPassword, error, loading, onSubmit, onGoogle }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-[#7C3AED] outline-none transition"
          required
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-12 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-[#7C3AED] outline-none transition"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#6366F1] rounded-xl text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Sign In'}
      </button>
      <GoogleButton onClick={onGoogle} />
    </form>
  )
}

// ===== Register Form Component =====
function RegisterForm({ name, setName, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, showPassword, setShowPassword, error, loading, onSubmit, onGoogle, onToggle }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-[#7C3AED] outline-none transition"
          required
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-[#7C3AED] outline-none transition"
          required
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-12 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-[#7C3AED] outline-none transition"
          required
          minLength={6}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-[#7C3AED] outline-none transition"
          required
        />
      </div>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#6366F1] rounded-xl text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Create Account'}
      </button>
      <GoogleButton onClick={onGoogle} />
      <div className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <button type="button" onClick={onToggle} className="text-[#7C3AED] font-semibold hover:underline">
          Sign In
        </button>
      </div>
    </form>
  )
}

// ===== Google Button =====
function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition flex items-center justify-center gap-3"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Continue with Google
    </button>
  )
}