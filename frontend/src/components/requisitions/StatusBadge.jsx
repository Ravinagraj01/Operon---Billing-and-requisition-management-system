import React from 'react'
import { getStageBadgeColor } from '../../utils/helpers'
import { useTheme } from '../../context/ThemeContext'

const StatusBadge = ({ stage }) => {
  const { isDarkMode } = useTheme()
  const colorClass = getStageBadgeColor(stage, isDarkMode)
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {stage.replace('_', ' ').toUpperCase()}
    </span>
  )
}

export default StatusBadge
