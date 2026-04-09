import React, { createContext, useContext, useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const newToast = {
      id,
      message,
      type,
      timestamp: new Date()
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getIcon = (type) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-green-400" />,
      error: <AlertCircle className="w-5 h-5 text-red-400" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      info: <Info className="w-5 h-5 text-blue-400" />
    }
    return icons[type] || icons.info
  }

  const getBackgroundColor = (type) => {
    const colors = {
      success: 'bg-green-500/10 border-green-500/30',
      error: 'bg-red-500/10 border-red-500/30',
      warning: 'bg-yellow-500/10 border-yellow-500/30',
      info: 'bg-blue-500/10 border-blue-500/30'
    }
    return colors[type] || colors.info
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`glass-panel p-4 min-w-[300px] max-w-[400px] border ${getBackgroundColor(toast.type)} slide-in`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getIcon(toast.type)}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
