import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import PatientFormPage from './pages/PatientFormPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ISLPage from './pages/ISLPage.jsx'
import DMOLoginPage from './pages/DMOLoginPage.jsx'
import DMODashboardPage from './pages/DMODashboardPage.jsx'

import { AuthProvider } from './context/AuthContext.jsx'
import RoleSelectionPage from './pages/RoleSelectionPage.jsx'
import CitizenLoginPage from './pages/CitizenLoginPage.jsx'
import CitizenRegistrationPage from './pages/CitizenRegistrationPage.jsx'
import CitizenDashboardPage from './pages/CitizenDashboardPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PatientProvider>
          <Routes>
            <Route path="/" element={<RoleSelectionPage />} />
            <Route path="/login/asha" element={<LoginPage />} />
            <Route path="/login/dmo" element={<DMOLoginPage />} />
            <Route path="/login/citizen" element={<CitizenLoginPage />} />
            <Route path="/register/citizen" element={<CitizenRegistrationPage />} />
            
            <Route path="/home" element={<ProtectedRoute role="asha"><HomePage /></ProtectedRoute>} />
            <Route path="/patient" element={<ProtectedRoute role="asha"><PatientFormPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute role="asha"><ChatPage /></ProtectedRoute>} />
            <Route path="/isl" element={<ProtectedRoute role="asha"><ISLPage /></ProtectedRoute>} />
            
            <Route path="/dashboard/dmo" element={<ProtectedRoute role="dmo"><DMODashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/citizen" element={<ProtectedRoute role="citizen"><CitizenDashboardPage /></ProtectedRoute>} />
          </Routes>
        </PatientProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
