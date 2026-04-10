import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const DashboardWorking = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const colors = isDarkMode ? {
    bg: '#111827',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#374151',
    cardBg: '#1f2937'
  } : {
    bg: '#f3f4f6',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#d1d5db',
    cardBg: '#ffffff'
  }

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await api.get('/dashboard/stats')
        setStats(response.data)
        setError(null)
      } catch (err) {
        console.error('Dashboard load failed:', err)
        setError('Unable to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  const departmentEntries = stats ? Object.entries(stats.spend_by_department || {}) : []
  const stageEntries = stats ? Object.entries(stats.stage_counts || {}) : []

  if (loading) {
    return (
      <div style={{ color: colors.text, padding: '20px', backgroundColor: colors.bg, minHeight: '100vh' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
          {user?.full_name ? `Welcome, ${user.full_name}!` : 'Welcome!'}
        </h1>
        <div style={{ padding: '40px', borderRadius: '16px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, textAlign: 'center' }}>
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ color: colors.text, padding: '20px', backgroundColor: colors.bg, minHeight: '100vh' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
          {user?.full_name ? `Welcome, ${user.full_name}!` : 'Welcome!'}
        </h1>
        <div style={{ padding: '40px', borderRadius: '16px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, textAlign: 'center' }}>
          <p style={{ color: '#fca5a5' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ color: colors.text, padding: '20px', backgroundColor: colors.bg, minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        {user?.full_name ? `Welcome, ${user.full_name}!` : 'Welcome!'}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {[
          { label: 'Total Requisitions', value: stats.total_requisitions, accent: '#60a5fa' },
          { label: 'Pipeline Value', value: formatCurrency(stats.pipeline_value), accent: '#10b981' },
          { label: 'Pending Approvals', value: stats.pending_approvals, accent: '#f59e0b' },
          { label: 'Approved Value', value: formatCurrency(stats.approved_value), accent: '#8b5cf6' }
        ].map((card) => (
          <div key={card.label} style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: isDarkMode ? '0 12px 30px rgba(0,0,0,0.2)' : '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: card.accent, marginBottom: '10px' }}>{card.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <h3 style={{ color: colors.text, marginBottom: '16px' }}>Stage Distribution</h3>
          {stageEntries.length === 0 ? (
            <p style={{ color: colors.textSecondary }}>No stage data yet.</p>
          ) : (
            stageEntries.map(([stage, count]) => (
              <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ color: colors.textSecondary }}>{stage}</span>
                <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '6px 12px', borderRadius: '999px', fontSize: '12px' }}>{count}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <h3 style={{ color: colors.text, marginBottom: '16px' }}>Department Spend</h3>
          {departmentEntries.length === 0 ? (
            <p style={{ color: colors.textSecondary }}>No department data yet.</p>
          ) : (
            departmentEntries.map(([department, amount]) => (
              <div key={department} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ color: colors.textSecondary }}>{department}</span>
                <span style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
        <h3 style={{ color: colors.text, marginBottom: '16px' }}>Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', border: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.textSecondary, marginBottom: '8px' }}>Average Approval Time</div>
            <div style={{ color: colors.text, fontWeight: '700' }}>{stats.avg_approval_time_hours} hrs</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', border: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.textSecondary, marginBottom: '8px' }}>SLA Breached</div>
            <div style={{ color: colors.text, fontWeight: '700' }}>{stats.sla_breached}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardWorking
