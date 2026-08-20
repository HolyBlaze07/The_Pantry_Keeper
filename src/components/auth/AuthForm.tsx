import { useEffect, useState } from 'react'

import { supabase } from '../../lib/supabase'
import FaultyTerminal from './FaultyTerminal'
import ImageTrail from './ImageTrail'
import strawberrySprite from '../../assets/food sprites/fruit_strawberry.png'
import pastryBreadSprite from '../../assets/food sprites/pastry_bread.png'
import chocolateCakeSprite from '../../assets/food sprites/cake_chocolate.png'
import greenPepperSprite from '../../assets/food sprites/vegetable_bellpepper_green.png'
import breadSprite from '../../assets/food sprites/breadloaf.png'
import coffeeSprite from '../../assets/food sprites/coffee_espresso.png'
import butterSprite from '../../assets/food sprites/yellowbutterstick.png'
import appleSprite from '../../assets/food sprites/fruit_apple.png'

import './AuthForm.css'

function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    window.matchMedia('(max-width: 800px)').matches,
  )
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 800px)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMobileChange = () => setIsMobileViewport(mobileQuery.matches)
    const handleMotionChange = () => setPrefersReducedMotion(motionQuery.matches)

    mobileQuery.addEventListener('change', handleMobileChange)
    motionQuery.addEventListener('change', handleMotionChange)
    return () => {
      mobileQuery.removeEventListener('change', handleMobileChange)
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  const trailItems = [
    strawberrySprite,
    pastryBreadSprite,
    chocolateCakeSprite,
    greenPepperSprite,
    breadSprite,
    coffeeSprite,
    butterSprite,
    appleSprite,
  ]

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

        setMessage('Account created. Check your inbox to verify your email.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw error
        }

        setMessage('Signed in successfully.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMessage('Enter your email first, then tap Forgot password.')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      })

      if (error) {
        throw error
      }

      setMessage('Password reset email sent. Check your inbox.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send reset email.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSocialClick(provider: 'google' | 'apple') {
    setIsLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })

    if (error) {
      setMessage(error.message)
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      {!prefersReducedMotion && (
        <div className="auth-page-terminal" aria-hidden="true">
          <FaultyTerminal
            scale={isMobileViewport ? 1 : 1.5}
            gridMul={isMobileViewport ? [1.35, 1] : [2, 1]}
            digitSize={isMobileViewport ? 1.5 : 1.2}
            timeScale={isMobileViewport ? 0.28 : 0.5}
            pause={false}
            scanlineIntensity={isMobileViewport ? 0.24 : 0.5}
            glitchAmount={isMobileViewport ? 0.35 : 1}
            flickerAmount={isMobileViewport ? 0.25 : 1}
            noiseAmp={isMobileViewport ? 0.35 : 1}
            chromaticAberration={0}
            dither={0}
            curvature={0.1}
            tint="#8B7CFF"
            mouseReact={!isMobileViewport}
            mouseStrength={isMobileViewport ? 0 : 0.5}
            pageLoadAnimation
            brightness={0.6}
          />
        </div>
      )}

      <div className="auth-mobile-glow" aria-hidden="true" />

      <section className="auth-shell" aria-label="Account access">
        <section className="auth-brand-panel" aria-hidden="true">
          <div className="auth-brand__trail" aria-hidden="true">
            <ImageTrail items={trailItems} />
          </div>

          <h2 className="auth-brand__name">Amealy</h2>

          <div className="auth-brand__copy">
            <p>YOUR PERSONAL PANTRY</p>
            {/* <p>Your pantry adventure starts here.</p> */}
            <p>Collect it. Track it. Cook it.</p>
          </div>
          <div className="auth-brand__art" />
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-wrapper">
            <p className="auth-eyebrow">Amealy Account</p>
            <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>

            <div className="auth-social">
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => void handleSocialClick('google')}
                disabled={isLoading}
              >
                Continue with Google
              </button>
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => void handleSocialClick('apple')}
                disabled={isLoading}
              >
                Continue with Apple
              </button>
            </div>

            <div className="auth-divider" role="presentation">
              <span>or use email</span>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label>
                Password
                <div className="auth-password-row">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    placeholder="At least 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <button className="auth-submit" type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            {mode === 'signin' && (
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  void handleForgotPassword()
                }}
              >
                Forgot password?
              </button>
            )}

            {message && (
              <p className="auth-message" role="status" aria-live="polite">
                {message}
              </p>
            )}

            <p className="auth-switch">
              {mode === 'signin' ? 'No account?' : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin')
                  setMessage('')
                }}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}

export default AuthForm
