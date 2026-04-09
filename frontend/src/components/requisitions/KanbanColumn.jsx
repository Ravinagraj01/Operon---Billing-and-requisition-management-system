import React from 'react'
import RequisitionCard from './RequisitionCard'
import { getStageBadgeColor } from '../../utils/helpers'
import { useTheme } from '../../context/ThemeContext'

const KanbanColumn = ({ stage, label, requisitions, color }) => {
  const { isDarkMode } = useTheme()
  const stageRequisitions = requisitions.filter(req => req.stage === stage)
  const borderColor = getStageBadgeColor(stage, isDarkMode).split(' ')[0].replace('bg-', '')

  const stageDescriptions = {
    draft: 'Work in progress',
    submitted: 'Awaiting review',
    dept_review: 'Department approval',
    finance_review: 'Budget check',
    procurement: 'Final processing',
    approved: 'Completed',
    rejected: 'Declined'
  }

  return (
    <div className="flex-shrink-0 w-72 min-h-[400px]">
      {/* Column Header */}
      <div className={`flex flex-col p-3 rounded-t-lg border-l-4 ${
        isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
      }`}
           style={{ borderLeftColor: borderColor.replace('text-', '').replace('-100', '') }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStageBadgeColor(stage, isDarkMode).split(' ')[0]}`} />
            <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-white text-gray-600 border border-gray-300'
          }`}>
            {stageRequisitions.length}
          </span>
        </div>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {stageDescriptions[stage] || ''}
        </p>
      </div>

      {/* Cards Container */}
      <div className={`rounded-b-lg p-3 min-h-[350px] overflow-y-auto ${
        isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50 border border-gray-200 border-t-0'
      }`}>
        {stageRequisitions.length === 0 ? (
          <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDarkMode ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stageRequisitions.map(requisition => (
              <RequisitionCard key={requisition.id} requisition={requisition} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default KanbanColumn
