import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Point this to your backend deployed URL (Render) later. For now local:
const API_BASE_URL = 'https://swasthya-setu-full.onrender.com/api/v1'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null) // holds the JWT
  const [userRole, setUserRole] = useState(null) // 'asha' | 'dmo'
  const [user, setUser] = useState(null) // holds user info
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing JWT session
    const token = localStorage.getItem('access_token')
    const savedRole = localStorage.getItem('userRole')
    const savedUser = localStorage.getItem('user')

    if (token) {
      setSession({ access_token: token })
      setUserRole(savedRole)
      try {
        if (savedUser) setUser(JSON.parse(savedUser))
      } catch (e) {}
    }
    setLoading(false)
  }, [])

  const login = async (employee_id, password, role) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ employee_id, password, role })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed')
    }

    // Save tokens and info
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('userRole', data.user.role)
    localStorage.setItem('user', JSON.stringify(data.user))

    setSession({ access_token: data.access_token })
    setUserRole(data.user.role)
    setUser(data.user)

    return data
  }

  const logout = async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('user')

    setSession(null)
    setUserRole(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ session, userRole, user, loading, login, logout, setUserRole }}>
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
