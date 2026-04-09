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

const Sidebar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'dept_head', 'finance', 'admin'] },
    { name: 'Pipeline', href: '/pipeline', icon: Columns, roles: ['employee', 'dept_head', 'finance', 'admin'] },
    { name: 'New Request', href: '/requisitions/new', icon: PlusCircle, roles: ['employee', 'dept_head', 'finance', 'admin'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart2, roles: ['finance', 'admin'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  )

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-dark-surface border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-primary">Operon</h1>
        <p className="text-xs text-gray-400 mt-1">Requisition Pipeline</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className="p-4 border-t border-gray-800">
          <div className="glass-panel p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {getInitials(user.full_name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.full_name}
                </p>
                <p className="text-gray-400 text-xs capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-all duration-200"
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
