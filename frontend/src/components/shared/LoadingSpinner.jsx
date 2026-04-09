import React from 'react'

const LoadingSpinner = ({ size = "md", fullPage = false }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  const spinnerSize = sizeClasses[size] || sizeClasses.md

  if (fullPage) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full ${spinnerSize} border-b-2 border-primary`}></div>
    </div>
  )
}

export default LoadingSpinner
