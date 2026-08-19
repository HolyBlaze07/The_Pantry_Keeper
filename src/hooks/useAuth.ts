import { useEffect, useState } from 'react'

import type { Session } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function getInitialSession() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      setSession(initialSession)
      setIsLoading(false)
    }

    void getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    session,
    user: session?.user ?? null,
    isLoading,
  }
}