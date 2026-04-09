import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/shared/Toast'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import RequisitionCard from '../components/requisitions/RequisitionCard'
import { formatCurrency } from '../utils/helpers'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NewRequisition = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    vendor_suggestion: '',
    amount: '',
    department: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [priorityScore, setPriorityScore] = useState(5)
  
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const categories = [
    'IT', 'HR', 'Finance', 'Legal', 'Operations', 'Marketing', 'Security', 'Other'
  ]

  const calculatePriorityScore = (amount, category) => {
    let score = 5
    const amt = parseFloat(amount) || 0
    
    if (amt > 100000) score += 3
    else if (amt > 50000) score += 2
    else if (amt > 10000) score += 1
    
    if (category === 'IT' || category === 'Security') score += 2
    else if (category === 'Legal' || category === 'HR') score += 1
    
    return Math.min(Math.max(score, 1), 10)
  }

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        department: user.department || ''
      }))
    }
  }, [user])

  useEffect(() => {
    const score = calculatePriorityScore(formData.amount, formData.category)
    setPriorityScore(score)
  }, [formData.amount, formData.category])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }
    
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error')
      return
    }

    setIsSubmitting(true)
    
    try {
      const requisitionData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }
      
      const response = await api.post('/requisitions/', requisitionData)
      showToast(`Requisition ${response.data.req_id} created successfully!`, 'success')
      navigate('/pipeline')
    } catch (error) {
      showToast('Failed to create requisition', 'error')
      console.error('Create requisition error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preview data for the card
  const previewData = {
    req_id: 'REQ-XXXX',
    title: formData.title || 'Requisition Title',
    description: formData.description,
    category: formData.category || 'Category',
    vendor_suggestion: formData.vendor_suggestion,
    amount: parseFloat(formData.amount) || 0,
    department: formData.department || user?.department || 'Department',
    priority_score: priorityScore,
    stage: 'draft',
    is_duplicate_flag: false,
    created_at: new Date().toISOString(),
    creator: user
  }

  const getSLADeadline = () => {
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + 48)
    return deadline.toLocaleString()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>New Requisition</h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Create a new purchase requisition</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className={`p-6 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'
                } ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter requisition title"
                required
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400 border border-gray-700' 
                    : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'
                }`}
                placeholder="Provide detailed description (optional)"
              />
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-700' 
                    : 'bg-white text-gray-900 border border-gray-300'
                } ${errors.category ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-400 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            {/* Vendor Suggestion */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Vendor Suggestion
              </label>
              <input
                type="text"
                name="vendor_suggestion"
                value={formData.vendor_suggestion}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400 border border-gray-700' 
                    : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'
                }`}
                placeholder="Enter preferred vendor (optional)"
              />
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="1"
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'
                } ${errors.amount ? 'border-red-500' : ''}`}
                placeholder="0.00"
                required
              />
              {errors.amount && (
                <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'
                } ${errors.department ? 'border-red-500' : ''} ${user?.role === 'employee' ? 'cursor-not-allowed opacity-75' : ''}`}
                placeholder="Enter department"
                required
                readOnly={user?.role === 'employee'}
              />
              {errors.department && (
                <p className="text-red-400 text-sm mt-1">{errors.department}</p>
              )}
              {user?.role === 'employee' && (
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Department is pre-filled from your profile</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                'Create Requisition'
              )}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div>
            <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Live Preview</h3>
            <RequisitionCard requisition={previewData} />
          </div>

          {/* Priority Score Info */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Priority Score</h3>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${
                priorityScore >= 7 ? 'text-red-400' :
                priorityScore >= 4 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {priorityScore}/10
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {priorityScore >= 7 ? 'High Priority' :
                 priorityScore >= 4 ? 'Medium Priority' :
                 'Low Priority'}
              </p>
            </div>
            <div className={`mt-4 space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>• Amount {'>'} ₹1,00,000: +3 points</p>
              <p>• Amount {'>'} ₹50,000: +2 points</p>
              <p>• Amount {'>'} ₹10,000: +1 point</p>
              <p>• IT/Security category: +2 points</p>
              <p>• Legal/HR category: +1 point</p>
            </div>
          </div>

          {/* SLA Info */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SLA Information</h3>
            <div className="space-y-2">
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-medium">SLA Deadline:</span> 48 hours from submission
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-medium">Estimated Deadline:</span> {getSLADeadline()}
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Once submitted, this requisition will need to be approved within 48 hours to avoid SLA breach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewRequisition
