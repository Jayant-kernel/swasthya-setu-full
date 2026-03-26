import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, role }) {
  const { session, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
        <p>Loading… / ଲୋଡ଼ ହେଉଛି…</p>
      </div>
    )
  }

  // DMO uses bypass auth (no Supabase session required)
  if (role === 'dmo' && localStorage.getItem('dmo_bypass') === 'true') {
    return children
  }

  // Admin uses bypass auth
  if (role === 'admin' && localStorage.getItem('admin_bypass') === 'true') {
    return children
  }
  if (!session) {
    return <Navigate to="/" replace />
  }

  if (role && userRole !== role) {
    // If authenticated but wrong role, redirect to role-specific login or home
    return <Navigate to="/" replace />
  }

  return children
}
