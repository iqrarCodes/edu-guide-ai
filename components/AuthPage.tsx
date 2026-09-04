'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface AuthPageProps {
  mode: 'login' | 'signup'
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
  const containerRef = useRef<HTMLDivElement>(null)

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
      toast.success('Welcome back! ')
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
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] px-4 relative overflow-hidden">
      <div
        ref={containerRef}
        className={`relative w-[750px] max-w-full min-h-[500px] bg-[#1A1A2E] border-2 border-[#7C3AED] shadow-[0_0_25px_rgba(124,58,237,0.3)] rounded-2xl overflow-hidden transition-all duration-700 ${
          !isLogin ? 'active' : ''
        }`}
      >
        {/* ===== LOGIN FORM ===== */}
        <div className="absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-10 z-20 transition-all duration-700">
          <div className={`transform transition-all duration-700 delay-100 ${
            isLogin ? 'translate-x-0 opacity-100 blur-0' : '-translate-x-[120%] opacity-0 blur-[10px]'
          }`}>
            <h1 className="text-3xl font-bold text-white text-center">Login</h1>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 pr-12 text-white focus:border-[#7C3AED] outline-none transition"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 pr-12 text-white focus:border-[#7C3AED] outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-[#7C3AED] to-[#6366F1] border-none rounded-lg text-white font-semibold cursor-pointer hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
              <div className="text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm(false)}
                  className="text-[#7C3AED] font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </div>
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full h-12 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>
          </div>
        </div>

        {/* ===== REGISTER FORM ===== */}
        <div className="absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center px-10 z-20 pointer-events-none transition-all duration-700">
          <div className={`transform transition-all duration-700 delay-100 ${
            isLogin ? 'translate-x-[120%] opacity-0 blur-[10px]' : 'translate-x-0 opacity-100 blur-0 pointer-events-auto'
          }`}>
            <h1 className="text-3xl font-bold text-white text-center">Register</h1>
            <form onSubmit={handleRegister} className="mt-6 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 pr-12 text-white focus:border-[#7C3AED] outline-none transition"
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 pr-12 text-white focus:border-[#7C3AED] outline-none transition"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 pr-12 text-white focus:border-[#7C3AED] outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 pr-12 text-white focus:border-[#7C3AED] outline-none transition"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-[#7C3AED] to-[#6366F1] border-none rounded-lg text-white font-semibold cursor-pointer hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Register'}
              </button>
              <div className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleForm(true)}
                  className="text-[#7C3AED] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full h-12 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>
          </div>
        </div>

        {/* ===== INFO TEXT (Login) – FIXED: pointer-events-none when hidden ===== */}
        <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center px-10 z-20 transition-all duration-700 ${isLogin ? '' : 'pointer-events-none'}`}>
          <div className={`text-right transition-all duration-700 delay-100 ${
            isLogin ? 'translate-x-0 opacity-100 blur-0' : 'translate-x-[120%] opacity-0 blur-[10px]'
          }`}>
            <h2 className="text-3xl font-bold text-white">WELCOME BACK!</h2>
            <p className="text-sm text-gray-400 mt-2">
              We are happy to have you with us again. If you need any assistance, feel free to reach out.
            </p>
          </div>
        </div>

        {/* ===== INFO TEXT (Register) ===== */}
        <div className="absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-10 z-20 pointer-events-none transition-all duration-700">
          <div className={`transition-all duration-700 delay-100 ${
            isLogin ? '-translate-x-[120%] opacity-0 blur-[10px]' : 'translate-x-0 opacity-100 blur-0 pointer-events-auto'
          }`}>
            <h2 className="text-3xl font-bold text-white">WELCOME!</h2>
            <p className="text-sm text-gray-400 mt-2">
              We're delighted to have you here. If you need any assistance, feel free to reach out.
            </p>
          </div>
        </div>

        {/* ===== BACKGROUND ANIMATED PANEL ===== */}
        <div
          className={`absolute -top-1 right-0 w-[850px] h-[600px] bg-gradient-to-br from-[#0F0F1A] to-[#7C3AED] border-b-2 border-[#7C3AED] transform transition-all duration-[1.5s] ease-in-out z-10 ${
            isLogin ? 'rotate-[10deg] skew-y-[40deg]' : 'rotate-0 skew-y-0'
          }`}
          style={{ transformOrigin: 'bottom right' }}
        />
        <div
          className={`absolute top-full left-[250px] w-[850px] h-[700px] bg-[#1A1A2E] border-t-2 border-[#7C3AED] transform transition-all duration-[1.5s] ease-in-out z-10 ${
            isLogin ? 'rotate-0 skew-y-0' : 'rotate-[-11deg] skew-y-[-41deg]'
          }`}
          style={{ transformOrigin: 'bottom left' }}
        />
      </div>
    </div>
  )
}