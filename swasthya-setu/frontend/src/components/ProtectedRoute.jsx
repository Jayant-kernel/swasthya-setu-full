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

  if (!session) {
    return <Navigate to="/" replace />
  }

  if (role && userRole !== role) {
    // If authenticated but wrong role, redirect to role-specific login or home
    return <Navigate to="/" replace />
  }

  return children
}
