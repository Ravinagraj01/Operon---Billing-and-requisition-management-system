import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit, Trash2, Send, Check, X, RotateCcw, MessageSquare, Clock, AlertCircle, User } from 'lucide-react'
import StatusBadge from '../components/requisitions/StatusBadge'
import ApprovalTimeline from '../components/approvals/ApprovalTimeline'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import { formatCurrency, formatDateTime, timeAgo, getPriorityColor, isOverSLA, canApprove } from '../utils/helpers'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/shared/Toast'

const RequisitionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [requisition, setRequisition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('timeline')
  const [comment, setComment] = useState('')
  const [actionComment, setActionComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRequisition = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/requisitions/${id}`)
      setRequisition(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load requisition details')
      console.error('Requisition detail error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequisition()
  }, [id])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      setIsSubmitting(true)
      const response = await api.post(`/comments/${requisition.id}`, {
        message: comment
      })
      
      setRequisition(prev => ({
        ...prev,
        comments: [...prev.comments, response.data]
      }))
      setComment('')
      showToast('Comment added successfully', 'success')
    } catch (error) {
      showToast('Failed to add comment', 'error')
      console.error('Add comment error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproval = async (action) => {
    if (action !== 'approved' && !actionComment.trim()) {
      showToast('Comment is required for reject/return actions', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await api.post(`/approvals/${requisition.id}`, {
        action,
        comment: actionComment
      })
      
      // Refresh requisition data
      await fetchRequisition()
      setActionComment('')
      showToast(`Requisition ${action} successfully`, 'success')
    } catch (error) {
      showToast(`Failed to ${action} requisition`, 'error')
      console.error('Approval error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this requisition?')) return

    try {
      await api.delete(`/requisitions/${requisition.id}`)
      showToast('Requisition deleted successfully', 'success')
      navigate('/pipeline')
    } catch (error) {
      showToast('Failed to delete requisition', 'error')
      console.error('Delete error:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={fetchRequisition} />
      </div>
    )
  }

  if (!requisition) {
    return (
      <div className="p-6">
        <div className="glass-panel p-8 text-center">
          <p className="text-gray-400">Requisition not found</p>
        </div>
      </div>
    )
  }

  const canEdit = user.id === requisition.created_by_id && requisition.stage === 'draft'
  const canAct = canApprove(user.role, requisition.stage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              <span className="text-primary font-mono text-lg font-bold">
                {requisition.req_id}
              </span>
              <StatusBadge stage={requisition.stage} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{requisition.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{requisition.creator.full_name}</span>
              </span>
              <span>{requisition.department}</span>
              <span>{formatDateTime(requisition.created_at)}</span>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <div className="text-2xl font-bold text-white">
              {formatCurrency(requisition.amount)}
            </div>
            <div className={`text-sm font-medium ${getPriorityColor(requisition.priority_score)}`}>
              Priority: {requisition.priority_score}/10
            </div>
            {requisition.sla_deadline && (
              <div className={`text-sm flex items-center space-x-1 ${
                isOverSLA(requisition.sla_deadline) ? 'text-red-400' : 'text-gray-400'
              }`}>
                <Clock className="w-3 h-3" />
                <span>
                  SLA: {formatDateTime(requisition.sla_deadline)}
                  {isOverSLA(requisition.sla_deadline) && ' (BREACHED)'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Duplicate Warning */}
        {requisition.is_duplicate_flag && (
          <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <p className="text-orange-400 text-sm">
                This may be a duplicate of a recent request in the same category
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {requisition.description && (
          <div className="mt-4">
            <h3 className="text-white font-medium mb-2">Description</h3>
            <p className="text-gray-300">{requisition.description}</p>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Category:</span>
            <span className="text-white ml-2">{requisition.category}</span>
          </div>
          {requisition.vendor_suggestion && (
            <div>
              <span className="text-gray-400">Vendor:</span>
              <span className="text-white ml-2">{requisition.vendor_suggestion}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <>
            <button
              onClick={() => navigate(`/requisitions/${requisition.id}/edit`)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => handleApproval('submitted')}
              className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Approval</span>
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="glass-panel p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Approval Timeline
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Comments ({requisition.comments?.length || 0})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="glass-panel p-6">
            {activeTab === 'timeline' ? (
              <ApprovalTimeline 
                approvals={requisition.approvals || []} 
                currentStage={requisition.stage}
              />
            ) : (
              <div className="space-y-4">
                {/* Comments List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {requisition.comments?.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No comments yet</p>
                  ) : (
                    requisition.comments.map(comment => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-semibold">
                            {comment.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-medium text-sm">
                              {comment.user.full_name}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {timeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{comment.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="border-t border-gray-700 pt-4">
                  <div className="flex space-x-3">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      rows="3"
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!comment.trim() || isSubmitting}
                      className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Add Comment</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Action Panel */}
          <div className="glass-panel p-6">
            <h3 className="text-white font-semibold mb-4">Actions</h3>
            
            {canAct ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Comment {requisition.stage !== 'submitted' && '(required for reject/return)'}
                  </label>
                  <textarea
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    placeholder="Add your comments..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows="4"
                  />
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleApproval('approved')}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  
                  <button
                    onClick={() => handleApproval('rejected')}
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  
                  <button
                    onClick={() => handleApproval('returned')}
                    disabled={isSubmitting}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Return for Edit</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No action required from you at this stage</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RequisitionDetail
