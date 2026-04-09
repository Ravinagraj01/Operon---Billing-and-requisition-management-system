import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const PipelineWorking = () => {
  const [requisitions, setRequisitions] = useState([
    { id: 1, title: 'Office Supplies', stage: 'draft', department: 'Engineering', amount: 5000 },
    { id: 2, title: 'Laptops', stage: 'submitted', department: 'Engineering', amount: 25000 },
    { id: 3, title: 'Software Licenses', stage: 'dept_review', department: 'Engineering', amount: 15000 },
    { id: 4, title: 'Monitors', stage: 'finance_review', department: 'Engineering', amount: 20000 },
    { id: 5, title: 'Servers', stage: 'procurement', department: 'Engineering', amount: 500000 },
    { id: 6, title: 'Office Furniture', stage: 'approved', department: 'Engineering', amount: 75000 }
  ])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const colors = isDarkMode ? {
    bg: '#111827',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#374151',
    cardBg: '#1f2937',
    cardHover: '#374151'
  } : {
    bg: '#f3f4f6',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#d1d5db',
    cardBg: '#ffffff',
    cardHover: '#f9fafb'
  }

  const stages = ['draft', 'submitted', 'dept_review', 'finance_review', 'procurement', 'approved', 'rejected']

  const getStageLabel = (stage) => {
    const labels = {
      draft: 'Draft',
      submitted: 'Submitted',
      dept_review: 'Dept Review',
      finance_review: 'Finance Review',
      procurement: 'Procurement',
      approved: 'Approved',
      rejected: 'Rejected'
    }
    return labels[stage] || stage
  }

  const getRequisitionsByStage = (stage) => {
    return requisitions.filter(req => req.stage === stage)
  }

  return (
    <div style={{ color: colors.text, padding: '24px', backgroundColor: colors.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: `1px solid ${colors.border}`
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            marginBottom: '4px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Requisition Pipeline
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Track and manage all requisitions</p>
        </div>
        <button 
          onClick={() => navigate('/requisitions/new')}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          + New Requisition
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px 24px',
          borderRadius: '12px',
          flex: 1
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>Total</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{requisitions.length}</div>
        </div>
        <div style={{
          backgroundColor: colors.cardBg,
          padding: '16px 24px',
          borderRadius: '12px',
          flex: 1,
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Pending</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
            {requisitions.filter(r => r.stage !== 'approved' && r.stage !== 'rejected').length}
          </div>
        </div>
        <div style={{
          backgroundColor: colors.cardBg,
          padding: '16px 24px',
          borderRadius: '12px',
          flex: 1,
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Approved</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
            {requisitions.filter(r => r.stage === 'approved').length}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px'
      }}>
        {stages.map(stage => {
          const stageReqs = getRequisitionsByStage(stage)
          const stageColors = {
            draft: '#9ca3af',
            submitted: '#3b82f6',
            dept_review: '#f59e0b',
            finance_review: '#8b5cf6',
            procurement: '#ec4899',
            approved: '#10b981',
            rejected: '#ef4444'
          }
          const color = stageColors[stage] || '#9ca3af'
          
          return (
            <div key={stage} style={{
              backgroundColor: colors.cardBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${colors.border}`,
              minHeight: '300px',
              boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: `1px solid ${colors.border}`
              }}>
                <h3 style={{ 
                  color: color, 
                  fontSize: '13px', 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {getStageLabel(stage)}
                </h3>
                <div style={{
                  backgroundColor: `${color}20`,
                  color: color,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {stageReqs.length}
                </div>
              </div>
              
              {stageReqs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stageReqs.map(req => (
                    <div 
                      key={req.id}
                      onClick={() => navigate(`/requisitions/${req.id}`)}
                      style={{
                        background: isDarkMode ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' : '#ffffff',
                        padding: '16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: `1px solid ${colors.border}`,
                        transition: 'all 0.2s',
                        boxShadow: isDarkMode ? '0 2px 4px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = color
                        e.target.style.transform = 'translateY(-2px)'
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'
                        e.target.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: colors.text
                      }}>
                        {req.title}
                      </div>
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px', 
                        color: colors.textSecondary 
                      }}>
                        <span>₹{req.amount.toLocaleString()}</span>
                        <span style={{
                          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}>
                          {req.department}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '150px',
                  color: colors.textSecondary,
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>📋</div>
                  No requests
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PipelineWorking
