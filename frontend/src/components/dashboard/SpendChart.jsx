import React, { useState, useEffect } from 'react'
import { formatCurrency } from '../../utils/helpers'

const SpendChart = ({ spendByDepartment }) => {
  const [animatedWidths, setAnimatedWidths] = useState({})

  const data = Object.entries(spendByDepartment || {}).map(([department, amount]) => ({
    department,
    amount
  }))

  const maxAmount = Math.max(...data.map(item => item.amount), 1)

  useEffect(() => {
    // Animate bars on mount
    const timeouts = data.map((item, index) => {
      return setTimeout(() => {
        setAnimatedWidths(prev => ({
          ...prev,
          [item.department]: (item.amount / maxAmount) * 100
        }))
      }, index * 100)
    })

    return () => timeouts.forEach(timeout => clearTimeout(timeout))
  }, [data, maxAmount])

  if (data.length === 0) {
    return (
      <div className="glass-panel p-6">
        <h3 className="text-white font-semibold mb-4">Spend by Department</h3>
        <p className="text-gray-400 text-center py-8">No data available</p>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6">
      <h3 className="text-white font-semibold mb-4">Spend by Department</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.department} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white text-sm font-medium">{item.department}</span>
              <span className="text-white text-sm font-semibold">
                {formatCurrency(item.amount)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${animatedWidths[item.department] || 0}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SpendChart
