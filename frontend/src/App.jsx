import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/shared/Toast'
import ProtectedRoute from './components/shared/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard_Working'
// import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline_Working'
import NewRequisition from './pages/NewRequisition'
import RequisitionDetail from './pages/RequisitionDetail'
import Analytics from './pages/Analytics'
import Users from './pages/Users'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/pipeline" element={
              <ProtectedRoute>
                <AppLayout>
                  <Pipeline />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/requisitions/new" element={
              <ProtectedRoute>
                <AppLayout>
                  <NewRequisition />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/requisitions/:id" element={
              <ProtectedRoute>
                <AppLayout>
                  <RequisitionDetail />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute roles={['finance', 'admin']}>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout>
                  <Users />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}

export default App
