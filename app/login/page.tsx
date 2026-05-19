'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)
    setError('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else router.push('/')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f7f3ee; font-family: 'Jost', sans-serif; }
        .login-input { width: 100%; padding: 14px 18px; border: 1px solid #d9cfc7; border-radius: 14px; font-family: 'Jost', sans-serif; font-size: 14px; background: #fff; color: #2c2420; outline: none; transition: border-color 0.2s; }
        .login-input:focus { border-color: #c17b5c; }
        .login-btn { width: 100%; padding: 14px; background: #2c2420; color: #f7f3ee; border: none; border-radius: 14px; font-family: 'Jost', sans-serif; font-size: 14px; letter-spacing: 0.05em; cursor: pointer; transition: background 0.2s; }
        .login-btn:hover { background: #c17b5c; }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3.5rem', fontWeight: '600', color: '#2c2420', letterSpacing: '0.02em' }}>
                dres<span style={{ color: '#c17b5c' }}>s</span>ed
            </h1>
            <p style={{ color: '#9a8a80', fontSize: '14px', marginTop: '8px', letterSpacing: '0.03em' }}>
              {isSignUp ? 'Create your digital wardrobe' : 'Welcome back to your wardrobe'}
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #f0e8e0', boxShadow: '0 8px 40px rgba(44,36,32,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input className="login-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <input className="login-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              {error && <p style={{ color: '#e05555', fontSize: '13px', padding: '4px 0' }}>{error}</p>}
              <button className="login-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? 'One moment...' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '13px', color: '#9a8a80' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: '#c17b5c', cursor: 'pointer', fontWeight: '500' }}>
                {isSignUp ? 'Sign in' : 'Sign up'}
              </span>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}