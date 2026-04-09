import React from 'react'

function DashboardMinimal() {
  return React.createElement('div', {
    style: {
      backgroundColor: 'blue',
      color: 'white',
      padding: '20px',
      fontSize: '18px'
    }
  }, [
    React.createElement('h1', {}, '🔵 MINIMAL DASHBOARD 🔵'),
    React.createElement('p', {}, 'This is the most basic test'),
    React.createElement('p', {}, 'Time: ' + new Date().toLocaleTimeString())
  ])
}

export default DashboardMinimal
