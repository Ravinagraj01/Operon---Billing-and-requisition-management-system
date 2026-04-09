import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatCurrency, timeAgo, getPriorityColor, isOverSLA } from '../../utils/helpers'

const RequisitionCard = ({ requisition }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/requisitions/${requisition.id}`)
  }

  return (
    <div 
      onClick={handleClick}
      className="glass-panel p-4 border border-white/10 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-primary font-mono text-sm font-semibold">
          {requisition.req_id}
        </span>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getPriorityColor(requisition.priority_score)}`}>
            Priority: {requisition.priority_score}/10
          </span>
        </div>
      </div>

      {/* Title and Department */}
      <div className="mb-3">
        <h3 className="text-white font-semibold text-base mb-1 line-clamp-2">
          {requisition.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {requisition.department}
        </p>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-semibold text-base">
          {formatCurrency(requisition.amount)}
        </span>
        <StatusBadge stage={requisition.stage} />
      </div>

      {/* Time */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{timeAgo(requisition.created_at)}</span>
        {requisition.sla_deadline && isOverSLA(requisition.sla_deadline) && (
          <span className="text-red-400 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>SLA Breached</span>
          </span>
        )}
      </div>

      {/* Warning Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        {requisition.is_duplicate_flag && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Possible Duplicate
          </span>
        )}
        {requisition.sla_deadline && isOverSLA(requisition.sla_deadline) && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
            <Clock className="w-3 h-3 mr-1" />
            SLA Breached
          </span>
        )}
      </div>
    </div>
  )
}

export default RequisitionCard
