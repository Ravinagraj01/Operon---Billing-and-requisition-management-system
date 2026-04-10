import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const DashboardWorking = () => {
  const [stats, setStats] = useState(null)
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requisitionsError, setRequisitionsError] = useState(null)
  const [filteredStats, setFilteredStats] = useState({
    total_requisitions: 0,
    pipeline_value: 0,
    pending_approvals: 0,
    approved_value: 0,
    spend_by_department: {},
    stage_counts: {}
  })
  const [approvedRequisitions, setApprovedRequisitions] = useState([])
  const [pendingRequisitions, setPendingRequisitions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
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

    const fetchRequisitions = async () => {
      try {
        const response = await api.get('/requisitions/')
        setRequisitions(response.data || [])
        setRequisitionsError(null)
      } catch (err) {
        console.error('Dashboard requisitions load failed:', err)
        setRequisitionsError('Unable to load requisition details')
      }
    }

    fetchStats()
    fetchRequisitions()
  }, [])

  const calculateFilteredStats = (stats, user, requisitions) => {
    const defaultStats = {
      total_requisitions: 0,
      pipeline_value: 0,
      pending_approvals: 0,
      approved_value: 0,
      spend_by_department: {},
      stage_counts: {}
    }
    if (!stats) return { filteredStats: defaultStats, approved: [], pending: [] }
    let filteredApprovedRequisitions = requisitions.filter(req => req.stage === 'approved')
    let filteredPendingRequisitions = requisitions.filter(req => !['approved', 'rejected'].includes(req.stage))
    let filteredStats = { ...stats }
    
    if (user?.role === 'dept_head') {
      // For dept heads: only show requisitions from their department
      filteredApprovedRequisitions = filteredApprovedRequisitions.filter(req => req.department === user.department)
      filteredPendingRequisitions = filteredPendingRequisitions.filter(req => 
        req.department === user.department && req.stage === 'dept_review'
      )
      
      // Calculate department-specific stats
      const deptRequisitions = requisitions.filter(req => req.department === user.department)
      const deptApprovedValue = deptRequisitions
        .filter(req => req.stage === 'approved')
        .reduce((sum, req) => sum + Number(req.amount || 0), 0)
      const deptPipelineValue = deptRequisitions
        .filter(req => req.stage !== 'rejected')
        .reduce((sum, req) => sum + Number(req.amount || 0), 0)
      const deptPendingApprovals = deptRequisitions
        .filter(req => req.stage === 'dept_review')
        .length
      
      // Filter department spend to only show their department
      const userDeptSpend = stats?.spend_by_department?.[user.department]
      const filteredDeptEntries = userDeptSpend ? [[user.department, userDeptSpend]] : []
      
      // Filter stage counts to only show relevant stages for dept head
      const relevantStages = ['dept_review', 'approved']
      const filteredStageEntries = Object.entries(stats?.stage_counts || {})
        .filter(([stage]) => relevantStages.includes(stage))
        .map(([stage, count]) => {
          if (stage === 'dept_review') {
            // Count only dept_review items for this department
            return [stage, deptRequisitions.filter(req => req.stage === stage).length]
          }
          if (stage === 'approved') {
            // Count only approved items for this department
            return [stage, deptRequisitions.filter(req => req.stage === stage).length]
          }
          return [stage, count]
        })
      
      filteredStats = {
        ...stats,
        total_requisitions: deptRequisitions.length,
        pipeline_value: deptPipelineValue,
        pending_approvals: deptPendingApprovals,
        approved_value: deptApprovedValue,
        spend_by_department: Object.fromEntries(filteredDeptEntries),
        stage_counts: Object.fromEntries(filteredStageEntries)
      }
    } else if (user?.role === 'finance') {
      // For finance: show finance review tasks plus requisitions he has actioned at finance_review
      filteredApprovedRequisitions = requisitions.filter(req => ['procurement', 'approved'].includes(req.stage))
      filteredPendingRequisitions = requisitions.filter(req => req.stage === 'finance_review')
      
      const financeRequisitions = requisitions
      const financeApprovedValue = financeRequisitions
        .filter(req => ['procurement', 'approved'].includes(req.stage))
        .reduce((sum, req) => sum + Number(req.amount || 0), 0)
      const financePipelineValue = financeRequisitions
        .filter(req => req.stage !== 'rejected')
        .reduce((sum, req) => sum + Number(req.amount || 0), 0)
      const financePendingApprovals = financeRequisitions
        .filter(req => req.stage === 'finance_review')
        .length

      filteredStats = {
        ...stats,
        total_requisitions: financeRequisitions.length,
        pipeline_value: financePipelineValue,
        pending_approvals: financePendingApprovals,
        approved_value: financeApprovedValue,
        spend_by_department: stats.spend_by_department,
        stage_counts: stats.stage_counts
      }
    } else if (user?.role === 'admin') {
      // For admin: show all approved and all pending tasks
      filteredApprovedRequisitions = requisitions.filter(req => req.stage === 'approved')
      filteredPendingRequisitions = requisitions.filter(req => !['approved', 'rejected'].includes(req.stage))
      
      filteredStats = { ...stats }
    }
    
    return { filteredStats, approved: filteredApprovedRequisitions, pending: filteredPendingRequisitions }
  }

  useEffect(() => {
    const result = calculateFilteredStats(stats, user, requisitions)
    setFilteredStats(result.filteredStats)
    setApprovedRequisitions(result.approved)
    setPendingRequisitions(result.pending)
  }, [stats, user, requisitions])

  const stageLabels = {
    dept_review: 'Dept Review',
    finance_review: 'Finance Review',
    procurement: 'Procurement',
    approved: 'Approved',
    rejected: 'Rejected'
  }

  // For dept heads, only show relevant stages in the labels
  const relevantStageLabels = user?.role === 'dept_head' 
    ? { dept_review: 'Dept Review', approved: 'Approved' }
    : stageLabels

  const departmentEntries = filteredStats ? Object.entries(filteredStats.spend_by_department || {}) : []
  const stageEntries = filteredStats ? Object.entries(filteredStats.stage_counts || {}) : []

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
          { label: 'Total Requisitions', value: filteredStats.total_requisitions, accent: '#60a5fa' },
          { label: 'Pipeline Value', value: formatCurrency(filteredStats.pipeline_value), accent: '#10b981' },
          { label: 'Pending Approvals', value: filteredStats.pending_approvals, accent: '#f59e0b' },
          { label: 'Approved Value', value: formatCurrency(filteredStats.approved_value), accent: '#8b5cf6' }
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

      {/* <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
        <h3 style={{ color: colors.text, marginBottom: '16px' }}>Detailssddsd</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', border: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.textSecondary, marginBottom: '8px' }}>Average Approval Time</div>
            <div style={{ color: colors.text, fontWeight: '700' }}>{stats.avg_approval_time_hours} hrs</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', border: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.textSecondary, marginBottom: '8px' }}>SLA Breached</div>
            <div style={{ color: colors.text, fontWeight: '700' }}>{stats.sla_breached}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', border: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.textSecondary, marginBottom: '8px' }}>Latest Request</div>
            {stats.latest_requisition ? (
              <div>
                <div style={{ fontWeight: '700', color: colors.text, marginBottom: '6px' }}>{stats.latest_requisition.title}</div>
                <div style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '6px' }}>Req ID: {stats.latest_requisition.req_id}</div>
                <div style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '6px' }}>Stage: {stats.latest_requisition.stage.replace('_', ' ')}</div>
                <div style={{ color: colors.textSecondary, fontSize: '13px' }}>Updated: {formatDateTime(stats.latest_requisition.updated_at)}</div>
              </div>
            ) : (
              <div style={{ color: colors.textSecondary, fontSize: '13px' }}>No recent requisitions yet.</div>
            )}
          </div>
        </div>
      </div> */}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
        <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ color: colors.text, marginBottom: '6px' }}>Approved Requests</h3>
              <p style={{ color: colors.textSecondary, fontSize: '13px' }}>All approved requisitions</p>
            </div>
            <span style={{ backgroundColor: '#10b981', color: '#ecfdf5', padding: '6px 12px', borderRadius: '999px', fontSize: '12px' }}>{approvedRequisitions.length}</span>
          </div>

          {approvedRequisitions.length ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              {approvedRequisitions.slice(0, 5).map((req) => (
                <div key={req.id} style={{ padding: '16px', borderRadius: '16px', backgroundColor: isDarkMode ? '#111827' : '#ffffff', border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: colors.text }}>{req.title}</div>
                      <div style={{ color: colors.textSecondary, fontSize: '13px' }}>{req.req_id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#10b981', fontWeight: '700' }}>{formatCurrency(req.amount)}</div>
                      <div style={{ color: colors.textSecondary, fontSize: '12px' }}>{relevantStageLabels[req.stage] || req.stage}</div>
                    </div>
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: '12px' }}>Updated: {formatDateTime(req.updated_at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: colors.textSecondary, fontSize: '13px' }}>No approved requests yet.</p>
          )}
        </div>

        <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ color: colors.text, marginBottom: '6px' }}>Pending Tasks</h3>
              <p style={{ color: colors.textSecondary, fontSize: '13px' }}>Requests still awaiting approval</p>
            </div>
            <span style={{ backgroundColor: '#f59e0b', color: '#1a202c', padding: '6px 12px', borderRadius: '999px', fontSize: '12px' }}>{pendingRequisitions.length}</span>
          </div>

          {pendingRequisitions.length ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              {pendingRequisitions.slice(0, 5).map((req) => (
                <div key={req.id} style={{ padding: '16px', borderRadius: '16px', backgroundColor: isDarkMode ? '#111827' : '#ffffff', border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: colors.text }}>{req.title}</div>
                      <div style={{ color: colors.textSecondary, fontSize: '13px' }}>{req.req_id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#f59e0b', fontWeight: '700' }}>{relevantStageLabels[req.stage] || req.stage}</div>
                      <div style={{ color: colors.textSecondary, fontSize: '12px' }}>{formatCurrency(req.amount)}</div>
                    </div>
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: '12px' }}>Updated: {formatDateTime(req.updated_at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: colors.textSecondary, fontSize: '13px' }}>No pending tasks found.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardWorking
