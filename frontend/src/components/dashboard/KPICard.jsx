import React from 'react'

const KPICard = ({ title, value, subtitle, icon: Icon, borderColor }) => {
  return (
    <div className={`glass-panel p-6 border-t-4 ${borderColor} border border-white/10`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-white text-2xl font-bold mb-1">{value}</p>
          {subtitle && (
            <p className="text-gray-400 text-xs">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center ml-4">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
    </div>
  )
}

export default KPICard
