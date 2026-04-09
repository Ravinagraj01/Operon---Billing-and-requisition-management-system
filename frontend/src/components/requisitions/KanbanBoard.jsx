import React from 'react'
import KanbanColumn from './KanbanColumn'

const KanbanBoard = ({ requisitions }) => {
  const stages = [
    { key: 'draft', label: '📝 Draft' },
    { key: 'submitted', label: '📤 Submitted' },
    { key: 'dept_review', label: '👥 Dept Review' },
    { key: 'finance_review', label: '💰 Finance Review' },
    { key: 'procurement', label: '📦 Procurement' },
    { key: 'approved', label: '✅ Approved' },
    { key: 'rejected', label: '❌ Rejected' }
  ]

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex space-x-4 min-w-max">
        {stages.map(stage => (
          <KanbanColumn
            key={stage.key}
            stage={stage.key}
            label={stage.label}
            requisitions={requisitions}
            color={stage.key}
          />
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard
