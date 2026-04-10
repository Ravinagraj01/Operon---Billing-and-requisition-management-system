import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔍 AuthContext: Initializing auth...')
      const storedToken = localStorage.getItem('procura_token')
      const storedUser = localStorage.getItem('procura_user')
      
      console.log('📦 Found in localStorage:', { storedToken: !!storedToken, storedUser: !!storedUser })
      
      if (storedToken && storedUser) {
        try {
          console.log('🔐 Validating token...')
          // Validate token by calling /me endpoint
          const response = await api.get('/auth/me')
          console.log('✅ Token valid, user:', response.data)
          if (response.data) {
            setUser(response.data)
            setToken(storedToken)
          } else {
            throw new Error('Invalid user data')
          }
        } catch (err) {
          // Token is invalid, clear storage
          console.log('❌ Invalid token, clearing storage:', err.message)
          localStorage.removeItem('procura_token')
          localStorage.removeItem('procura_user')
          setUser(null)
          setToken(null)
        }
      } else {
        console.log('📭 No stored auth data found')
      }
      setIsLoading(false)
      console.log('🏁 Auth initialization complete. User:', !!user, 'Loading:', false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      console.log('🔑 Attempting login with:', { email, password: '***' })
      
      // Use the format that works with FastAPI OAuth2PasswordRequestForm
      const response = await api.post('/auth/login', 
        `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
      
      console.log('✅ Login API response:', response.status, response.data)
      
      const { access_token } = response.data
      
      // Get user info
      console.log('👤 Getting user info...')
      const userResponse = await api.get('/auth/me')
      const userData = userResponse.data
      console.log('✅ User data received:', userData)
      
      // Store in state and localStorage
      setToken(access_token)
      setUser(userData)
      localStorage.setItem('procura_token', access_token)
      localStorage.setItem('procura_user', JSON.stringify(userData))
      
      console.log('💾 Login complete, user authenticated')
      return userData
    } catch (err) {
      console.error('❌ Login failed:', err)
      console.error('❌ Error response:', err.response?.data)
      const errorMessage = err.response?.data?.detail || 'Login failed'
      setError(errorMessage)
      throw err
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('procura_token')
    localStorage.removeItem('procura_user')
    window.location.href = '/login'
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await api.post('/auth/register', userData)
      const { access_token } = response.data
      
      // Get user info
      const userResponse = await api.get('/auth/me')
      const userInfo = userResponse.data
      
      // Store in state and localStorage
      setToken(access_token)
      setUser(userInfo)
      localStorage.setItem('procura_token', access_token)
      localStorage.setItem('procura_user', JSON.stringify(userInfo))
      
      return userInfo
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Registration failed'
      setError(errorMessage)
      throw err
    }
  }

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    register
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
