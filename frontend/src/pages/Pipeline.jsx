import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, Info, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import KanbanBoard from '../components/requisitions/KanbanBoard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../components/shared/Toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { formatCurrency } from '../utils/helpers'

const Pipeline = () => {
  const [requisitions, setRequisitions] = useState([])
  const [filteredRequisitions, setFilteredRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    department: ''
  })
  
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  // Calculate pipeline stats
  const getPipelineStats = () => {
    const total = filteredRequisitions.length
    const pending = filteredRequisitions.filter(r => ['submitted', 'dept_review', 'finance_review', 'procurement'].includes(r.stage)).length
    const approved = filteredRequisitions.filter(r => r.stage === 'approved').length
    const rejected = filteredRequisitions.filter(r => r.stage === 'rejected').length
    const totalValue = filteredRequisitions.filter(r => r.stage !== 'rejected').reduce((sum, r) => sum + r.amount, 0)
    
    return { total, pending, approved, rejected, totalValue }
  }

  const stats = getPipelineStats()

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      // Backend uses authenticated user context for role-based filtering
      // Add user filters
      if (filters.stage) params.append('stage', filters.stage)
      if (filters.department) params.append('department', filters.department)
      if (filters.search) params.append('search', filters.search)
      
      const response = await api.get(`/requisitions/?${params.toString()}`)
      setRequisitions(response.data)
      setFilteredRequisitions(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load requisitions')
      console.error('Pipeline error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequisitions()
  }, [])

  useEffect(() => {
    // Apply search filter with debounce
    const timeoutId = setTimeout(() => {
      if (filters.search || filters.stage || filters.department) {
        fetchRequisitions()
      } else {
        setFilteredRequisitions(requisitions)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters.search, filters.stage, filters.department])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ search: '', stage: '', department: '' })
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={fetchRequisitions} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Requisition Pipeline</h1>
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
              <Info className="w-3 h-3" />
              <span>Track & manage requests</span>
            </div>
          </div>
          <p className={isDarkMode ? 'text-gray-400 mt-2' : 'text-gray-600 mt-2'}>
            Monitor requisitions through the approval workflow from draft to final approval
          </p>
        </div>
        <button
          onClick={() => navigate('/requisitions/new')}
          className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Requests</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Review</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border-l-4 border-green-500 ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.approved}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border-l-4 border-purple-500 ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pipeline Value</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Filter className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filter Requests</span>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search by title or REQ-ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-400' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Stage Filter */}
          <div className="lg:w-48">
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 text-white' 
                  : 'bg-white border border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Stages</option>
              <option value="draft">📝 Draft</option>
              <option value="submitted">📤 Submitted</option>
              <option value="dept_review">👥 Dept Review</option>
              <option value="finance_review">💰 Finance Review</option>
              <option value="procurement">📦 Procurement</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="lg:w-48">
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 text-white' 
                  : 'bg-white border border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Finance">Finance</option>
              <option value="Management">Management</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(filters.search || filters.stage || filters.department) && (
            <button
              onClick={clearFilters}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Workflow Progress Indicator */}
      <div className={`p-4 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Info className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Approval Workflow</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Draft</span>
          </div>
          <div className={`flex-1 h-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full bg-blue-500`} />
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Submitted</span>
          </div>
          <div className={`flex-1 h-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full bg-yellow-500`} />
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Dept Review</span>
          </div>
          <div className={`flex-1 h-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full bg-orange-500`} />
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Finance</span>
          </div>
          <div className={`flex-1 h-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full bg-purple-500`} />
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Procurement</span>
          </div>
          <div className={`flex-1 h-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full bg-green-500`} />
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Approved</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className={`rounded-lg p-4 ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
        <KanbanBoard requisitions={filteredRequisitions} />
      </div>
    </div>
  )
}

export default Pipeline
