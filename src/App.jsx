import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Packages from './pages/Packages'
import Recipients from './pages/Recipients'
import Locations from './pages/Locations'
import Prices from './pages/Prices'
import StaffManagement from './pages/StaffManagement'
import NotificationSettings from './pages/NotificationSettings'
import NotFound from './pages/NotFound'

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  const { checkAuth } = useAuth()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <AuthLayout>
            <Login />
          </AuthLayout>
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/packages" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Packages />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/recipients" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Recipients />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin-only Routes */}
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <StaffManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/locations" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Locations />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/prices" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Prices />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/notification-settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <NotificationSettings />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App