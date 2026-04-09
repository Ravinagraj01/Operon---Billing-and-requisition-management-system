import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const AppLayout = ({ children }) => {
  const location = useLocation()
  const { isDarkMode } = useTheme()

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/pipeline') return 'Requisition Pipeline'
    if (path === '/requisitions/new') return 'New Requisition'
    if (path.startsWith('/requisitions/')) return 'Requisition Details'
    if (path === '/analytics') return 'Analytics'
    if (path === '/users') return 'Users Management'
    return 'Operon'
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />
      <div className="ml-60">
        <Navbar title={getPageTitle()} />
        <main className="pt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
