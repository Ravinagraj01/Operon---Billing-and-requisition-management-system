import React, { useState, useEffect } from 'react'
import { FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import KPICard from '../components/dashboard/KPICard'
import SpendChart from '../components/dashboard/SpendChart'
import SLAAlert from '../components/dashboard/SLAAlert'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import { formatCurrency, getStageLabel, getStageBadgeColor, formatDate } from '../utils/helpers'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  console.log('📊 Dashboard Component: MOUNTING!', new Date().toISOString())

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  console.log('📊 Dashboard Component: State initialized', { loading, error, stats: !!stats, user: !!user })

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      console.log('📊 Dashboard: Fetching stats...')
      const response = await api.get('/dashboard/stats')
      console.log('📊 Dashboard: Response received:', response.status, response.data)
      setStats(response.data)
      setError(null)
      console.log('📊 Dashboard: Stats set in state')
    } catch (err) {
      console.error('❌ Dashboard error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // TEMP: Hardcode data for testing
  const tempStats = {
    total_requisitions: 6,
    pipeline_value: 675000,
    pending_approvals: 1,
    approved_value: 75000,
    avg_approval_time_hours: 0,
    spend_by_department: {'Engineering': 75000},
    stage_counts: {'approved': 1, 'dept_review': 1, 'draft': 1, 'finance_review': 1, 'procurement': 1, 'submitted': 1},
    sla_breached: 0
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  console.log('📊 Dashboard Component: State check', { loading, error, stats: !!stats, user: !!user })

  if (loading) {
    console.log('📊 Dashboard: Showing loading spinner')
    return <LoadingSpinner fullPage />
  }

  if (error) {
    console.log('📊 Dashboard: Showing error state', error)
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={fetchDashboardStats} />
      </div>
    )
  }

  if (!stats) {
    console.log('📊 Dashboard: No stats data, returning null')
    return null
  }

  return (
    <div className="space-y-6">
      {/* TEST: Simple render test */}
      <div className="glass-panel p-6">
        <h1 className="text-white text-2xl">TEST: Dashboard is rendering!</h1>
        <p className="text-gray-400">Current time: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {getGreeting()}, {user?.full_name}
        </h1>
        <p className="text-gray-400">Here's what's happening with your requisitions today</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Requisitions"
          value={stats?.total_requisitions || tempStats.total_requisitions}
          icon={FileText}
          borderColor="border-blue-500"
        />
        <KPICard
          title="Pipeline Value"
          value={formatCurrency(stats?.pipeline_value || tempStats.pipeline_value)}
          subtitle="Active requisitions"
          icon={TrendingUp}
          borderColor="border-green-500"
        />
        <KPICard
          title="Pending Approvals"
          value={stats?.pending_approvals || tempStats.pending_approvals}
          icon={Clock}
          borderColor="border-yellow-500"
        />
        <KPICard
          title="Approved Value"
          value={formatCurrency(stats?.approved_value || tempStats.approved_value)}
          subtitle="This month"
          icon={CheckCircle}
          borderColor="border-purple-500"
        />
      </div>

      {/* SLA Alert */}
      <SLAAlert slaBreached={stats?.sla_breached || tempStats.sla_breached} />

      {/* Charts and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend Chart */}
        <SpendChart spendByDepartment={stats?.spend_by_department || tempStats.spend_by_department} />

        {/* Stage Distribution */}
        <div className="glass-panel p-6">
          <h3 className="text-white font-semibold mb-4">Stage Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats?.stage_counts || tempStats.stage_counts).map(([stage, count]) => (
              <div key={stage} className="flex justify-between items-center">
                <span className="text-gray-300">{getStageLabel(stage)}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${getStageBadgeColor(stage)}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-white font-semibold mb-2">Avg Approval Time</h3>
          <p className="text-2xl font-bold text-primary">
            {stats.avg_approval_time_hours}h
          </p>
          <p className="text-gray-400 text-sm">From submission to approval</p>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-white font-semibold mb-2">Total Departments</h3>
          <p className="text-2xl font-bold text-primary">
            {Object.keys(stats.spend_by_department).length}
          </p>
          <p className="text-gray-400 text-sm">Active departments</p>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-white font-semibold mb-2">SLA Compliance</h3>
          <p className="text-2xl font-bold text-primary">
            {stats.total_requisitions > 0 
              ? Math.round(((stats.total_requisitions - stats.sla_breached) / stats.total_requisitions) * 100)
              : 100}%
          </p>
          <p className="text-gray-400 text-sm">Within 48-hour window</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
