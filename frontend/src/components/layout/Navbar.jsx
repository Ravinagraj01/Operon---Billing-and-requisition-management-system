import React from 'react'
import { Moon, Sun } from 'lucide-react'
import NotificationBell from '../notifications/NotificationBell'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const Navbar = ({ title }) => {
  const { user } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <div className={`fixed top-0 left-60 right-0 h-16 flex items-center justify-between px-6 z-10 ${isDarkMode ? 'bg-dark-surface border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
      {/* Page Title */}
      <div>
        <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {/* Notifications */}
        <NotificationBell />
        
        {/* User Name */}
        <div className="text-right">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.full_name}</p>
          <p className={`text-xs capitalize ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Navbar
