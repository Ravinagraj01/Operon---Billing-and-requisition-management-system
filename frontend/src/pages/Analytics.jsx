import React, { useState, useEffect } from 'react'
import { Download, TrendingUp, FileText, Clock } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import { formatCurrency, formatDate } from '../utils/helpers'
import api from '../api/axios'
import { useTheme } from '../context/ThemeContext'

const Analytics = () => {
  const [stats, setStats] = useState(null)
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isDarkMode } = useTheme()

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const [statsResponse, requisitionsResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/requisitions/')
      ])
      setStats(statsResponse.data)
      setRequisitions(requisitionsResponse.data)
      setError(null)
    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const generateReport = () => {
    const report = `
OPERON ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY STATISTICS
==================
Total Requisitions: ${stats?.total_requisitions || 0}
Pipeline Value: ${formatCurrency(stats?.pipeline_value || 0)}
Approved Value: ${formatCurrency(stats?.approved_value || 0)}
Pending Approvals: ${stats?.pending_approvals || 0}
Average Approval Time: ${stats?.avg_approval_time_hours || 0} hours
SLA Breached: ${stats?.sla_breached || 0}

SPEND BY DEPARTMENT
==================
${Object.entries(stats?.spend_by_department || {}).map(([dept, amount]) => 
  `${dept}: ${formatCurrency(amount)}`
).join('\n')}

STAGE DISTRIBUTION
==================
${Object.entries(stats?.stage_counts || {}).map(([stage, count]) => 
  `${stage}: ${count}`
).join('\n')}

COMPLIANCE RATE
===============
${stats?.total_requisitions > 0 
  ? Math.round(((stats.total_requisitions - stats.sla_breached) / stats.total_requisitions) * 100)
  : 0}% within SLA

RECENT REQUISITIONS
==================
${requisitions.slice(0, 10).map(req => 
  `${req.req_id} - ${req.title} - ${req.stage} - ${formatCurrency(req.amount)}`
).join('\n')}
    `.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `operon-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={fetchAnalyticsData} />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  // Calculate additional analytics
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthRequisitions = requisitions.filter(req => {
    const reqDate = new Date(req.created_at)
    return reqDate.getMonth() === currentMonth && reqDate.getFullYear() === currentYear
  })

  const thisMonthApproved = thisMonthRequisitions.filter(req => req.stage === 'approved')
  const thisMonthValue = thisMonthApproved.reduce((sum, req) => sum + req.amount, 0)

  // Top departments by spend
  const topDepartments = Object.entries(stats.spend_by_department || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  // Top categories by value
  const categoryStats = {}
  requisitions.forEach(req => {
    if (req.stage === 'approved') {
      categoryStats[req.category] = (categoryStats[req.category] || 0) + req.amount
    }
  })
  const topCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  // Weekly data for last 4 weeks
  const weeklyData = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i * 7))
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    
    const weekRequisitions = requisitions.filter(req => {
      const reqDate = new Date(req.created_at)
      return reqDate >= weekStart && reqDate < weekEnd
    })
    
    weeklyData.push({
      week: `Week ${4 - i}`,
      count: weekRequisitions.length,
      value: weekRequisitions.reduce((sum, req) => sum + req.amount, 0)
    })
  }

  const maxWeeklyValue = Math.max(...weeklyData.map(w => w.value), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Analytics</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Comprehensive insights into requisition performance</p>
        </div>
        <button
          onClick={generateReport}
          className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-lg border-t-4 border-green-500 ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>This Month Approved Value</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(thisMonthValue)}</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{thisMonthApproved.length} requisitions</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border-t-4 border-blue-500 ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>This Month Requisitions</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{thisMonthRequisitions.length}</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total submitted</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border-t-4 border-orange-500 ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Approval Time</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.avg_approval_time_hours}h</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>From submission to approval</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Departments */}
        <div className={`p-6 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top 3 Departments by Spend</h3>
          <div className="space-y-3">
            {topDepartments.length === 0 ? (
              <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data available</p>
            ) : (
              topDepartments.map(([dept, amount], index) => (
                <div key={dept} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-500/20 text-gray-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{dept}</span>
                  </div>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className={`p-6 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top 3 Categories by Value</h3>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data available</p>
            ) : (
              topCategories.map(([category, amount], index) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-500/20 text-gray-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{category}</span>
                  </div>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className={`p-6 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
        <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Requisitions per Week (Last 4 Weeks)</h3>
        <div className="space-y-4">
          {weeklyData.map((week, index) => (
            <div key={week.week} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{week.week}</span>
                <div className="text-right">
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{week.count} reqs</span>
                  <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatCurrency(week.value)}</span>
                </div>
              </div>
              <div className={`w-full rounded-full h-3 overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(week.value / maxWeeklyValue) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Rate */}
      <div className={`p-6 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
        <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SLA Compliance Rate</h3>
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full border-8 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
            <div 
              className="absolute top-0 left-0 w-32 h-32 rounded-full border-8 border-green-500 border-t-transparent border-r-transparent transform -rotate-45"
              style={{
                borderRightColor: 'transparent',
                borderTopColor: 'transparent',
                transform: `rotate(-90deg)`,
                background: `conic-gradient(#10b981 0deg ${(stats.total_requisitions > 0 ? ((stats.total_requisitions - stats.sla_breached) / stats.total_requisitions) * 360 : 0)}deg, ${isDarkMode ? '#374151' : '#e5e7eb'} 0deg)`
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.total_requisitions > 0 
                    ? Math.round(((stats.total_requisitions - stats.sla_breached) / stats.total_requisitions) * 100)
                    : 100}%
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Compliance</p>
              </div>
            </div>
          </div>
        </div>
        <p className={`text-center mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {stats.total_requisitions - stats.sla_breached} of {stats.total_requisitions} requisitions completed within SLA
        </p>
      </div>
    </div>
  )
}

export default Analytics
