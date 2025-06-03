import { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'
import { API_URL } from '../config'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setUser(user)
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to login. Please try again.'
      }
    }
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const checkAuth = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setLoading(false)
        return
      }
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setUser(response.data.user)
    } catch (error) {
      console.error('Auth check error:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}