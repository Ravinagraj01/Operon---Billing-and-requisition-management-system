import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Columns, 
  PlusCircle, 
  BarChart2, 
  Users, 
  LogOut 
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { isDarkMode } = useTheme()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'dept_head', 'finance', 'admin'] },
    { name: 'Pipeline', href: '/pipeline', icon: Columns, roles: ['employee', 'dept_head', 'finance', 'admin'] },
    { name: 'New Request', href: '/requisitions/new', icon: PlusCircle, roles: ['employee', 'dept_head'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart2, roles: ['dept_head', 'finance', 'admin'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  )

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleGradientClass = (role) => {
    const gradients = {
      admin: 'role-tag-admin',
      finance: 'role-tag-finance',
      dept_head: 'role-tag-dept-head',
      employee: 'role-tag-employee'
    }
    return gradients[role] || 'role-tag-employee'
  }

  return (
    <div className={`fixed left-0 top-0 bottom-0 w-60 flex flex-col rounded-3xl z-50 overflow-y-auto ${isDarkMode ? 'glass-panel' : 'bg-white/90 border-r border-gray-200 shadow-sm'}`}>
      {/* Logo */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Operon</h1>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Requisition Pipeline</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                isActive
                  ? 'text-white bg-primary/20' 
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-xl blur-xl opacity-50"></div>
              )}
              <div className={`relative z-10 ${isActive ? 'text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className={`font-medium relative z-10 ${isActive ? 'text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-900'}`}>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {getInitials(user.full_name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.full_name}
                </p>
                <p className={`text-xs capitalize ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className={`mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
