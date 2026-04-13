import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { migrateLegacyLocalData, setStorageScope } from '../lib/storage'
import { migrateLegacyReminderData } from '../lib/reminders'
import { hydrateLocalStateFromCloud, saveRemoteAppState, getLocalAppStateSnapshot } from '../lib/cloudState'
import { STORAGE_SYNC_EVENT } from '../lib/storageScope'

const AuthContext = createContext(null)

function applyScopeFromSession(session) {
  const scope = session?.user?.id || 'guest'
  setStorageScope(scope)

  if (session?.user?.id) {
    migrateLegacyLocalData(session.user.id)
    migrateLegacyReminderData(session.user.id)
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cloudError, setCloudError] = useState('')
  const hydratingRef = useRef(false)
  const syncTimeoutRef = useRef(null)

  const queueCloudSync = (userId) => {
    if (!userId || !supabase || hydratingRef.current) return

    window.clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = window.setTimeout(async () => {
      const { error } = await saveRemoteAppState(userId, getLocalAppStateSnapshot())
      if (error) {
        setCloudError(error.message)
      } else {
        setCloudError('')
      }
    }, 800)
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageScope('guest')
      setLoading(false)
      return undefined
    }

    let mounted = true

    const handleSession = async (nextSession) => {
      applyScopeFromSession(nextSession)

      if (nextSession?.user?.id) {
        hydratingRef.current = true
        const result = await hydrateLocalStateFromCloud(nextSession.user.id)
        if (!mounted) return
        if (result.error) {
          setCloudError(result.error.message)
        } else {
          setCloudError('')
        }
        hydratingRef.current = false
      } else {
        setCloudError('')
      }

      setSession(nextSession)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      handleSession(data.session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true)
      handleSession(nextSession)
    })

    return () => {
      mounted = false
      window.clearTimeout(syncTimeoutRef.current)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id || !supabase) return undefined

    const userId = session.user.id
    const handleScopedStorageChange = (event) => {
      if (event?.detail?.scope && event.detail.scope !== userId) return
      queueCloudSync(userId)
    }

    const flushOnHide = () => {
      if (document.visibilityState === 'hidden') {
        window.clearTimeout(syncTimeoutRef.current)
        saveRemoteAppState(userId, getLocalAppStateSnapshot()).then(({ error }) => {
          if (error) setCloudError(error.message)
        })
      }
    }

    window.addEventListener(STORAGE_SYNC_EVENT, handleScopedStorageChange)
    document.addEventListener('visibilitychange', flushOnHide)

    return () => {
      window.removeEventListener(STORAGE_SYNC_EVENT, handleScopedStorageChange)
      document.removeEventListener('visibilitychange', flushOnHide)
      window.clearTimeout(syncTimeoutRef.current)
    }
  }, [session?.user?.id])

  const signInWithPassword = async ({ email, password }) => {
    if (!supabase) return { data: null, error: new Error('Supabase is not configured.') }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUpWithPassword = async ({ email, password, redirectPath = '/app' }) => {
    if (!supabase) return { data: null, error: new Error('Supabase is not configured.') }

    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectPath}`,
      },
    })
  }

  const signOut = async () => {
    if (!supabase) return { error: null }
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        isConfigured: isSupabaseConfigured,
        loading,
        session,
        user: session?.user ?? null,
        cloudError,
        signInWithPassword,
        signUpWithPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return context
}
