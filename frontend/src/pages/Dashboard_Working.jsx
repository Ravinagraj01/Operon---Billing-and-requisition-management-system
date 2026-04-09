import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const DashboardWorking = () => {
  console.log('🎯 DASHBOARD COMPONENT MOUNTED!', new Date().toISOString())
  
  const [stats, setStats] = useState({
    total_requisitions: 6,
    pipeline_value: 675000,
    pending_approvals: 1,
    approved_value: 75000,
    avg_approval_time_hours: 0,
    spend_by_department: {'Engineering': 75000},
    stage_counts: {'approved': 1, 'dept_review': 1, 'draft': 1, 'finance_review': 1, 'procurement': 1, 'submitted': 1},
    sla_breached: 0
  })
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const colors = isDarkMode ? {
    bg: '#1f2937',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#374151',
    cardBg: '#1f2937'
  } : {
    bg: '#f9fafb',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    cardBg: '#ffffff'
  }

  return (
    <div style={{ color: colors.text, padding: '20px', backgroundColor: colors.bg, minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        {user?.full_name ? `Welcome, ${user.full_name}!` : 'Welcome!'}
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          backgroundColor: colors.cardBg, 
          padding: '20px', 
          borderRadius: '8px', 
          border: `1px solid ${colors.border}` 
        }}>
          <h3 style={{ color: '#60a5fa', marginBottom: '10px' }}>Total Requisitions</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>{stats.total_requisitions}</p>
        </div>
        
        <div style={{ 
          backgroundColor: colors.cardBg, 
          padding: '20px', 
          borderRadius: '8px', 
          border: `1px solid ${colors.border}` 
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '10px' }}>Pipeline Value</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>${stats.pipeline_value.toLocaleString()}</p>
        </div>
        
        <div style={{ 
          backgroundColor: colors.cardBg, 
          padding: '20px', 
          borderRadius: '8px', 
          border: `1px solid ${colors.border}` 
        }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>Pending Approvals</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>{stats.pending_approvals}</p>
        </div>
        
        <div style={{ 
          backgroundColor: colors.cardBg, 
          padding: '20px', 
          borderRadius: '8px', 
          border: `1px solid ${colors.border}` 
        }}>
          <h3 style={{ color: '#8b5cf6', marginBottom: '10px' }}>Approved Value</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>${stats.approved_value.toLocaleString()}</p>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: colors.cardBg, 
        padding: '20px', 
        borderRadius: '8px', 
        border: `1px solid ${colors.border}` 
      }}>
        <h3 style={{ color: colors.text, marginBottom: '15px' }}>Stage Distribution</h3>
        {Object.entries(stats.stage_counts).map(([stage, count]) => (
          <div key={stage} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '8px 0', 
            borderBottom: `1px solid ${colors.border}` 
          }}>
            <span style={{ color: colors.textSecondary }}>{stage}</span>
            <span style={{ 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '12px' 
            }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardWorking
