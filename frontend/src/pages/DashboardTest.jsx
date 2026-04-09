import React from 'react'

const DashboardTest = () => {
  return (
    <div style={{color: 'white', padding: '20px', fontSize: '24px'}}>
      <h1>🚀 DASHBOARD TEST PAGE 🚀</h1>
      <p>If you can see this, the routing is working!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      <p>Random number: {Math.random()}</p>
    </div>
  )
}

export default DashboardTest
