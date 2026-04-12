import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

import ASHADashboardPage from './pages/asha/ASHADashboardPage.jsx'
import PatientFormPage from './pages/asha/PatientFormPage.jsx'
import ChatPage from './pages/asha/ChatPage.jsx'
import ISLPage from './pages/asha/ISLPage.jsx'
import ProfilePage from './pages/asha/ProfilePage.jsx'
import ChildbirthPage from './pages/asha/ChildbirthPage.jsx'

import DMODashboardPage from './pages/dmo/DMODashboardPage.jsx'
import DMOMapPage from './pages/dmo/DMOMapPage.jsx'
import DMOLoginPage from './pages/dmo/DMOLoginPage.jsx'

import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminMapPage from './pages/admin/AdminMapPage.jsx'

import LandingPage from './pages/landing/LandingPage.jsx'
import RoleSelectionPage from './pages/landing/RoleSelectionPage.jsx'
import UnderConstructionPage from './pages/landing/UnderConstructionPage.jsx'

import DataCollector from './components/common/DataCollector.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <PatientProvider>
            <Routes>
              {/* Landing & Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/roles" element={<RoleSelectionPage />} />
              <Route path="/under-construction" element={<UnderConstructionPage />} />
              <Route path="/login/dmo" element={<DMOLoginPage />} />

              {/* ASHA Portal */}
              <Route path="/home" element={<ProtectedRoute role="asha"><ASHADashboardPage /></ProtectedRoute>} />
              <Route path="/patient" element={<ProtectedRoute role="asha"><PatientFormPage /></ProtectedRoute>} />
              <Route path="/isl" element={<ProtectedRoute role="asha"><ISLPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute role="asha"><ChatPage /></ProtectedRoute>} />
              <Route path="/childbirth" element={<ProtectedRoute role="asha"><ChildbirthPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute role="asha"><ProfilePage /></ProtectedRoute>} />
              
              <Route path="/data-collector" element={<DataCollector />} />

              {/* DMO Portal */}
              <Route path="/dashboard/dmo" element={<ProtectedRoute role="dmo"><DMODashboardPage /></ProtectedRoute>} />
              <Route path="/dashboard/dmo/map" element={<ProtectedRoute role="dmo"><DMOMapPage /></ProtectedRoute>} />
              
              {/* Admin Portal */}
              <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/dashboard/admin/analytics" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/dashboard/admin/map" element={<ProtectedRoute><AdminMapPage /></ProtectedRoute>} />
            </Routes>
          </PatientProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
