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
  
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const categories = [
    'IT', 'HR', 'Finance', 'Legal', 'Operations', 'Marketing', 'Security', 'Other'
  ]

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        department: user.department || ''
      }))
    }
  }, [user])

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
    stage: 'submitted',
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
        <h1 className="text-2xl font-bold text-white mb-2">New Requisition</h1>
        <p className="text-gray-400">Create a new purchase requisition</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-panel p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Enter requisition title"
                required
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Provide detailed description (optional)"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-700'
                }`}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor Suggestion
              </label>
              <input
                type="text"
                name="vendor_suggestion"
                value={formData.vendor_suggestion}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter preferred vendor (optional)"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="1"
                className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.amount ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="0.00"
                required
              />
              {errors.amount && (
                <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.department ? 'border-red-500' : 'border-gray-700'
                } ${user?.role === 'employee' ? 'cursor-not-allowed opacity-75' : ''}`}
                placeholder="Enter department"
                required
                readOnly={user?.role === 'employee'}
              />
              {errors.department && (
                <p className="text-red-400 text-sm mt-1">{errors.department}</p>
              )}
              {user?.role === 'employee' && (
                <p className="text-gray-400 text-xs mt-1">Department is pre-filled from your profile</p>
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
            <h3 className="text-white font-semibold mb-4">Live Preview</h3>
            <RequisitionCard requisition={previewData} />
          </div>


          {/* SLA Info */}
          <div className="glass-panel p-6">
            <h3 className="text-white font-semibold mb-4">SLA Information</h3>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                <span className="font-medium">SLA Deadline:</span> 48 hours from submission
              </p>
              <p className="text-gray-300 text-sm">
                <span className="font-medium">Estimated Deadline:</span> {getSLADeadline()}
              </p>
              <p className="text-gray-400 text-xs mt-2">
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
