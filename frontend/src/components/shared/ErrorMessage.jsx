import React from 'react'
import { X } from 'lucide-react'

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="glass-panel p-6 border-red-500/50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-4 h-4 text-red-400" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-red-400 font-semibold mb-1">Error</h3>
          <p className="text-gray-300 text-sm">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-red-400 hover:text-red-300 text-sm font-medium underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
