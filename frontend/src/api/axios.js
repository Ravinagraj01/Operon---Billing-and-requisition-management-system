import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('procura_token')
  console.log('🔍 Axios Request:', config.method?.toUpperCase(), config.url)
  console.log('🔑 Token found:', !!token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('📤 Authorization header set:', config.headers.Authorization)
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('✅ Axios Response:', response.config.method?.toUpperCase(), response.config.url, response.status)
    return response
  },
  (error) => {
    console.log('❌ Axios Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status)
    if (error.response?.status === 401) {
      console.log('🚪 401 Error - redirecting to login')
      localStorage.removeItem('procura_token')
      localStorage.removeItem('procura_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
