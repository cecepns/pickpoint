import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock, FaSpinner } from 'react-icons/fa'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error('Please enter both username and password')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await login(username, password)
      
      if (result.success) {
        toast.success('Login successful')
        navigate('/dashboard')
      } else {
        toast.error(result.message || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="text-gray-400" />
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input pl-8"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-8"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  )
}

export default Login