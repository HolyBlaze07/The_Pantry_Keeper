import { useState } from 'react'

import { supabase } from '../../lib/supabase'

function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          throw error
        }

        setMessage('Account created successfully!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw error
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="auth-card">
      <p>YOUR PERSONAL PANTRY</p>
      <h1>{mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        </label>

        <label>
          Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
        </label>

        <div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </form>

      {message && <p role="status">{message}</p>}

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signup' ? 'signin' : 'signup')
          setMessage('')
        }}
      >
        {mode === 'signup' ? "Already have an account? Sign in" : "Don't have an account? Create one"}
      </button>
    </section>
  )
}

export default AuthForm
