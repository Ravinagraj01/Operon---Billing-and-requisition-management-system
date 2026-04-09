import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/shared/Toast'
import LoadingSpinner from '../components/shared/LoadingSpinner'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const demoCredentials = [
    { role: 'Admin', email: 'admin@procura.com', password: 'admin' },
    { role: 'Finance', email: 'finance@procura.com', password: 'fin' },
    { role: 'Dept Head', email: 'depthead@procura.com', password: 'dept' },
    { role: 'Employee', email: 'employee@procura.com', password: 'emp' }
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('📝 Login form submitted with:', { email: formData.email, password: '***' })
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      console.log('❌ Form validation failed')
      return
    }

    console.log('✅ Form validation passed, calling login...')
    setIsLoading(true)
    setError('')

    try {
      console.log('🚀 About to call login function...')
      const result = await login(formData.email, formData.password)
      console.log('🎉 Login function returned:', result)
      showToast('Login successful!', 'success')
      navigate('/dashboard')
    } catch (err) {
      console.log('💥 Login failed with error:', err)
      setError(err.response?.data?.detail || 'Login failed')
      showToast('Login failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (email, password) => {
    setFormData({ email, password })
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Operon</h1>
          <p className="text-gray-300">Requisition Pipeline Management</p>
        </div>

        {/* Login Form */}
        <div className="glass-panel p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="glass-panel p-6">
          <h3 className="text-white font-semibold mb-4 text-center">Demo Credentials</h3>
          <div className="grid grid-cols-2 gap-3">
            {demoCredentials.map((cred) => (
              <button
                key={cred.role}
                onClick={() => fillDemoCredentials(cred.email, cred.password)}
                className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-left transition-colors"
              >
                <p className="text-primary font-medium text-sm">{cred.role}</p>
                <p className="text-gray-400 text-xs">{cred.email}</p>
                <p className="text-gray-500 text-xs">{cred.password}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
