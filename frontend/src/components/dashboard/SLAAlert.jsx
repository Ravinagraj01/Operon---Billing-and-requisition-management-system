import React from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SLAAlert = ({ slaBreached, breachedItems }) => {
  const navigate = useNavigate()

  if (slaBreached === 0) {
    return null
  }

  return (
    <div className="glass-panel p-4 border-red-500/50 bg-red-500/10">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-red-400 font-semibold mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            SLA Breach Alert
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            {slaBreached} requisition{slaBreached !== 1 ? 's' : ''} ha{slaBreached === 1 ? 's' : 've'} 
            exceeded {slaBreached === 1 ? 'its' : 'their'} 48-hour approval window
          </p>
          {breachedItems && breachedItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {breachedItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/requisitions/${item.id}`)}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  {item.req_id}
                </button>
              ))}
              {breachedItems.length > 5 && (
                <span className="text-gray-400 text-xs px-2 py-1">
                  +{breachedItems.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SLAAlert
