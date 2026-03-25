import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null) // 'asha' | 'dmo' | 'citizen'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        // In a real app, you'd fetch the role from a profiles table
        // For now, we'll use localStorage or a mock
        const savedRole = localStorage.getItem('userRole')
        setUserRole(savedRole)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        const savedRole = localStorage.getItem('userRole')
        setUserRole(savedRole)
      } else {
        setUserRole(null)
        localStorage.removeItem('userRole')
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password, role) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    localStorage.setItem('userRole', role)
    setUserRole(role)
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('userRole')
    setUserRole(null)
  }

  return (
    <AuthContext.Provider value={{ session, userRole, loading, login, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
