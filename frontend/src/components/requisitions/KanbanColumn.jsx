import React from 'react'
import RequisitionCard from './RequisitionCard'
import { getStageBadgeColor } from '../../utils/helpers'

const KanbanColumn = ({ stage, label, requisitions, color }) => {
  const stageRequisitions = requisitions.filter(req => req.stage === stage)
  const borderColor = getStageBadgeColor(stage).split(' ')[0].replace('bg-', '')

  return (
    <div className="flex-shrink-0 w-72 min-h-[400px]">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-3 rounded-t-lg border-l-4 bg-gray-800/50`}
           style={{ borderLeftColor: borderColor.replace('text-', '').replace('-100', '') }}>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStageBadgeColor(stage).split(' ')[0]}`} />
          <h3 className="text-white font-semibold text-sm">{label}</h3>
        </div>
        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
          {stageRequisitions.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="bg-gray-800/30 rounded-b-lg p-3 min-h-[350px] overflow-y-auto">
        {stageRequisitions.length === 0 ? (
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm">No requests</p>
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
