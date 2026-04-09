import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const DashboardSimple = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('procura_token')}`
          }
        })
        const data = await response.json()
        setStats(data)
        console.log('Dashboard stats:', data)
      } catch (err) {
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div style={{ 
      backgroundColor: 'red', 
      color: 'white', 
      padding: '50px', 
      fontSize: '24px',
      minHeight: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999
    }}>
      <h1 style={{ backgroundColor: 'yellow', color: 'black' }}>🚀 DASHBOARD TEST 🚀</h1>
      <p>If you can see this, React is working!</p>
      <p>User: {user?.full_name || 'No user'}</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Total Requisitions: {stats?.total_requisitions || 'No data'}</p>
          <p>Pipeline Value: ${stats?.pipeline_value?.toLocaleString() || 'No data'}</p>
        </div>
      )}
    </div>
  )
}

export default DashboardSimple
