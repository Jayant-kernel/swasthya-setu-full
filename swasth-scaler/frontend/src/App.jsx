import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import HomePage from './pages/HomePage.jsx'
import PatientFormPage from './pages/PatientFormPage.jsx'
import ChatPage from './pages/ChatPage.jsx'

import DMODashboardPage from './pages/DMODashboardPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'

import { AuthProvider } from './context/AuthContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import ISLPage from './pages/ISLPage.jsx'
import UnderConstructionPage from './pages/UnderConstructionPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import DataCollector from './components/DataCollector.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <PatientProvider>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/under-construction" element={<UnderConstructionPage />} />


            <Route path="/home" element={<ProtectedRoute role="asha"><HomePage /></ProtectedRoute>} />
            <Route path="/patient" element={<ProtectedRoute role="asha"><PatientFormPage /></ProtectedRoute>} />
            <Route path="/isl" element={<ProtectedRoute role="asha"><ISLPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute role="asha"><ChatPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute role="asha"><ProfilePage /></ProtectedRoute>} />
            <Route path="/data-collector" element={<DataCollector />} />

            <Route path="/dashboard/dmo" element={<ProtectedRoute role="dmo"><DMODashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
            </Routes>
          </PatientProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
