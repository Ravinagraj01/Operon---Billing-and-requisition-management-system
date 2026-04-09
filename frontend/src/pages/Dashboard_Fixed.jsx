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
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

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

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={fetchDashboardStats} />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <h1 className="text-white text-2xl">Loading dashboard data...</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          value={stats.total_requisitions}
          icon={FileText}
          borderColor="border-blue-500"
        />
        <KPICard
          title="Pipeline Value"
          value={formatCurrency(stats.pipeline_value)}
          subtitle="Active requisitions"
          icon={TrendingUp}
          borderColor="border-green-500"
        />
        <KPICard
          title="Pending Approvals"
          value={stats.pending_approvals}
          icon={Clock}
          borderColor="border-yellow-500"
        />
        <KPICard
          title="Approved Value"
          value={formatCurrency(stats.approved_value)}
          subtitle="This month"
          icon={CheckCircle}
          borderColor="border-purple-500"
        />
      </div>

      {/* SLA Alert */}
      <SLAAlert slaBreached={stats.sla_breached} />

      {/* Charts and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend Chart */}
        <SpendChart spendByDepartment={stats.spend_by_department} />

        {/* Stage Distribution */}
        <div className="glass-panel p-6">
          <h3 className="text-white font-semibold mb-4">Stage Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.stage_counts).map(([stage, count]) => (
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
    </div>
  )
}

export default Dashboard
