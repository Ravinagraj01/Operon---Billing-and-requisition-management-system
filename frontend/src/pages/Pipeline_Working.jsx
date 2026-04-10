import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const PipelineWorking = () => {
  const [requisitions, setRequisitions] = useState([])
  const [filteredRequisitions, setFilteredRequisitions] = useState([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const colors = isDarkMode ? {
    bg: '#111827',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#374151',
    cardBg: '#1f2937',
    inputBg: '#1f2937',
    inputBorder: '#374151'
  } : {
    bg: '#f3f4f6',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#d1d5db',
    cardBg: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db'
  }

  const stages = ['draft', 'submitted', 'dept_review', 'finance_review', 'procurement', 'approved', 'rejected']

  const stageMeta = {
    draft: { label: 'Draft', color: '#9ca3af', emoji: '📝', description: 'Initial request created.' },
    submitted: { label: 'Submitted', color: '#3b82f6', emoji: '📤', description: 'Awaiting department review.' },
    dept_review: { label: 'Dept Review', color: '#f59e0b', emoji: '👤', description: 'Dept Head approval pending.' },
    finance_review: { label: 'Finance Review', color: '#8b5cf6', emoji: '💰', description: 'Finance validation stage.' },
    procurement: { label: 'Procurement', color: '#ec4899', emoji: '🧾', description: 'Final procurement approval.' },
    approved: { label: 'Approved', color: '#10b981', emoji: '✅', description: 'Requisition fully approved.' },
    rejected: { label: 'Rejected', color: '#ef4444', emoji: '❌', description: 'Request has been rejected.' }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  const getPriorityColor = (score) => {
    if (score >= 8) return '#ef4444'
    if (score >= 6) return '#f59e0b'
    if (score >= 4) return '#3b82f6'
    return '#10b981'
  }

  const getSlaStatus = (deadline) => {
    if (!deadline) return 'No deadline'
    const target = new Date(deadline)
    const diffMs = target - new Date()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffMs < 0) return `BREACHED by ${Math.abs(diffDays)}d`
    return `${diffDays}d left`
  }

  const fetchRequisitions = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/requisitions/')
      setRequisitions(response.data || [])
      setFilteredRequisitions(response.data || [])
    } catch (err) {
      console.error('Pipeline fetch failed:', err)
      setError(err.response?.data?.detail || 'Unable to load requisitions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequisitions()
  }, [])

  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const result = requisitions.filter((req) => {
      const matchesSearch = normalizedSearch
        ? req.title.toLowerCase().includes(normalizedSearch) || req.req_id.toLowerCase().includes(normalizedSearch)
        : true
      const matchesPriority = priorityFilter === 'all'
        ? true
        : req.priority_score >= Number(priorityFilter)
      const matchesDepartment = departmentFilter === 'all'
        ? true
        : req.department === departmentFilter
      return matchesSearch && matchesPriority && matchesDepartment
    })

    setFilteredRequisitions(result)
  }, [requisitions, search, priorityFilter, departmentFilter])

  const departments = useMemo(() => {
    const unique = Array.from(new Set(requisitions.map((req) => req.department).filter(Boolean)))
    return unique.sort()
  }, [requisitions])

  const stageCounts = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = filteredRequisitions.filter((req) => req.stage === stage).length
      return acc
    }, {})
  }, [filteredRequisitions])

  const totalValue = filteredRequisitions.reduce((sum, req) => sum + Number(req.amount || 0), 0)
  const pendingCount = filteredRequisitions.filter((req) => req.stage !== 'approved' && req.stage !== 'rejected').length
  const approvedCount = filteredRequisitions.filter((req) => req.stage === 'approved').length

  return (
    <div style={{ color: colors.text, padding: '24px', backgroundColor: colors.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${colors.border}` }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Requisition Pipeline
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
            {user?.full_name ? `Welcome back, ${user.full_name}.` : 'Track, filter, and manage active requisitions.'}
          </p>
        </div>
        <button onClick={() => navigate('/requisitions/new')} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)', transition: 'all 0.2s' }}>
          + New Requisition
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total requests', value: filteredRequisitions.length, accent: '#667eea' },
          { label: 'Pending', value: pendingCount, accent: '#f59e0b' },
          { label: 'Approved', value: approvedCount, accent: '#10b981' },
          { label: 'Pipeline value', value: formatCurrency(totalValue), accent: '#8b5cf6' }
        ].map((card) => (
          <div key={card.label} style={{ backgroundColor: colors.cardBg, borderRadius: '16px', padding: '20px', border: `1px solid ${colors.border}`, boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.2)' : '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: card.accent, marginBottom: '10px' }}>{card.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or ID" style={{ flex: '1 1 260px', minWidth: '220px', padding: '14px 16px', borderRadius: '14px', border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg, color: colors.text }} />
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ padding: '14px 16px', borderRadius: '14px', border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg, color: colors.text, minWidth: '180px' }}>
          <option value="all">All priorities</option>
          <option value="8">Priority 8+</option>
          <option value="6">Priority 6+</option>
          <option value="4">Priority 4+</option>
        </select>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ padding: '14px 16px', borderRadius: '14px', border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg, color: colors.text, minWidth: '180px' }}>
          <option value="all">All departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <button onClick={fetchRequisitions} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '14px', padding: '14px 20px', cursor: 'pointer', minWidth: '140px' }}>
          Refresh
        </button>
      </div>

      {loading && (
        <div style={{ padding: '24px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, marginBottom: '24px', textAlign: 'center' }}>
          Loading requisitions...
        </div>
      )}

      {error && (
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#fee2e2', color: '#991b1b', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {stages.map((stage) => {
          const stageReqs = filteredRequisitions.filter((req) => req.stage === stage)
          const meta = stageMeta[stage] || {}

          return (
            <div key={stage} style={{ backgroundColor: colors.cardBg, borderRadius: '20px', padding: '20px', border: `1px solid ${colors.border}`, minHeight: '340px', boxShadow: isDarkMode ? '0 12px 32px rgba(0, 0, 0, 0.2)' : '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: meta.color }}>{meta.emoji} {meta.label}</h2>
                  <p style={{ marginTop: '8px', color: colors.textSecondary, fontSize: '13px' }}>{meta.description}</p>
                </div>
                <div style={{ backgroundColor: `${meta.color}20`, color: meta.color, borderRadius: '999px', padding: '8px 14px', fontWeight: '700', fontSize: '12px' }}>
                  {stageReqs.length}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                {stageReqs.length > 0 ? stageReqs.map((req) => (
                  <article key={req.id} onClick={() => navigate(`/requisitions/${req.id}`)} style={{ cursor: 'pointer', borderRadius: '18px', padding: '18px', border: `1px solid ${colors.inputBorder}`, backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, marginBottom: '6px' }}>{req.title}</h3>
                        <p style={{ color: colors.textSecondary, fontSize: '13px' }}>{req.req_id}</p>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: getPriorityColor(req.priority_score), backgroundColor: `${getPriorityColor(req.priority_score)}20`, padding: '6px 10px', borderRadius: '999px' }}>
                        P{req.priority_score}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', color: colors.textSecondary, fontSize: '13px' }}>
                      <span>{formatCurrency(req.amount)}</span>
                      <span>{req.department}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', color: colors.textSecondary, fontSize: '12px' }}>
                      <span>{req.creator?.full_name || 'Creator unknown'}</span>
                      <span>{req.is_duplicate_flag ? '⚠️ Duplicate' : getSlaStatus(req.sla_deadline)}</span>
                    </div>
                  </article>
                )) : (
                  <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: isDarkMode ? '#111827' : '#ffffff', textAlign: 'center', color: colors.textSecondary, minHeight: '120px' }}>
                    No requisitions in this stage.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PipelineWorking
