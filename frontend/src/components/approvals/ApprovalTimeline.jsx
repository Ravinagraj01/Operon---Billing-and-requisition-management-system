import React from 'react'
import { Check, X, Clock, User } from 'lucide-react'
import { formatDateTime } from '../../utils/helpers'

const ApprovalTimeline = ({ approvals, currentStage }) => {
  const stages = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'dept_review', label: 'Dept Review' },
    { key: 'finance_review', label: 'Finance Review' },
    { key: 'procurement', label: 'Procurement' },
    { key: 'approved', label: 'Approved' }
  ]

  const getApprovalForStage = (stage) => {
    return approvals.find(approval => approval.stage === stage)
  }

  const getStageStatus = (stage) => {
    const approval = getApprovalForStage(stage)
    if (approval) {
      return approval.action === 'approved' ? 'completed' : 
             approval.action === 'rejected' ? 'rejected' : 'returned'
    }
    
    const stageIndex = stages.findIndex(s => s.key === stage)
    const currentIndex = stages.findIndex(s => s.key === currentStage)
    
    if (stageIndex === currentIndex) return 'active'
    if (stageIndex < currentIndex) return 'completed'
    return 'pending'
  }

  return (
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
      
      {/* Stages */}
      <div className="space-y-6">
        {stages.map((stage, index) => {
          const approval = getApprovalForStage(stage.key)
          const status = getStageStatus(stage.key)
          
          return (
            <div key={stage.key} className="relative flex items-start space-x-4">
              {/* Status Dot */}
              <div className="relative z-10">
                {status === 'completed' && (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                {status === 'rejected' && (
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </div>
                )}
                {status === 'returned' && (
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </div>
                )}
                {status === 'active' && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse-slow">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                )}
                {status === 'pending' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{stage.label}</h4>
                  {status === 'active' && (
                    <span className="text-blue-400 text-sm">Awaiting action</span>
                  )}
                </div>

                {approval ? (
                  <div className="glass-panel p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-white text-sm font-medium">
                        {approval.approver.full_name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        approval.action === 'approved' ? 'bg-green-500/20 text-green-400' :
                        approval.action === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {approval.action.toUpperCase()}
                      </span>
                    </div>
                    {approval.comment && (
                      <p className="text-gray-300 text-sm mb-2">{approval.comment}</p>
                    )}
                    <p className="text-gray-400 text-xs">
                      {formatDateTime(approval.acted_at)}
                    </p>
                  </div>
                ) : status === 'pending' ? (
                  <p className="text-gray-400 text-sm">Not yet reached</p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ApprovalTimeline
