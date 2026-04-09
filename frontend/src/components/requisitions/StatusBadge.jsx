import React from 'react'
import { getStageBadgeColor } from '../../utils/helpers'

const StatusBadge = ({ stage }) => {
  const colorClass = getStageBadgeColor(stage)
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {stage.replace('_', ' ').toUpperCase()}
    </span>
  )
}

export default StatusBadge
