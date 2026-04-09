import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus } from 'lucide-react'
import KanbanBoard from '../components/requisitions/KanbanBoard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../components/shared/Toast'

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

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Requisition Pipeline</h1>
          <p className="text-gray-400">
            Showing {filteredRequisitions.length} requisition{filteredRequisitions.length !== 1 ? 's' : ''}
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

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title or REQ-ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Stage Filter */}
          <div className="lg:w-48">
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Stages</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="dept_review">Dept Review</option>
              <option value="finance_review">Finance Review</option>
              <option value="procurement">Procurement</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="lg:w-48">
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <KanbanBoard requisitions={filteredRequisitions} />
      </div>
    </div>
  )
}

export default Pipeline
