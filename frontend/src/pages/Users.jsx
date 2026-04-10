import React, { useState, useEffect } from 'react'
import { Edit, Trash2, Search, User as UserIcon } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import { useToast } from '../components/shared/Toast'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const Users = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    role: '',
    department: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { showToast } = useToast()
  const { isDarkMode } = useTheme()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/')
      setUsers(response.data)
      setFilteredUsers(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load users')
      console.error('Users error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleEdit = (user) => {
    setEditingUser(user)
    setEditForm({
      role: user.role,
      department: user.department || ''
    })
  }

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true)
      await api.put(`/users/${editingUser.id}`, editForm)
      
      setUsers(prev => prev.map(user =>
        user.id === editingUser.id
          ? { ...user, ...editForm }
          : user
      ))
      
      setEditingUser(null)
      showToast('User updated successfully', 'success')
    } catch (error) {
      showToast('Failed to update user', 'error')
      console.error('Update user error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async (user) => {
    if (!confirm(`Are you sure you want to deactivate ${user.full_name}?`)) return

    try {
      await api.delete(`/users/${user.id}`)
      
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, is_active: false } : u
      ))
      
      showToast('User deactivated successfully', 'success')
    } catch (error) {
      showToast('Failed to deactivate user', 'error')
      console.error('Deactivate user error:', error)
    }
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'role-tag-admin',
      finance: 'role-tag-finance',
      dept_head: 'role-tag-dept-head',
      employee: 'role-tag-employee'
    }
    return colors[role] || colors.employee
  }

  const getStatusBadgeColor = (isActive) => {
    return isActive
      ? 'status-capsule-active'
      : 'bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs'
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={fetchUsers} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Users Management</h1>
        <p className="text-gray-400">Manage system users and their permissions</p>
      </div>

      {/* Search */}
      <div className="glass-panel p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-3 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 font-medium text-gray-400">User</th>
                <th className="text-left p-4 font-medium text-gray-400">Email</th>
                <th className="text-left p-4 font-medium text-gray-400">Role</th>
                <th className="text-left p-4 font-medium text-gray-400">Department</th>
                <th className="text-left p-4 font-medium text-gray-400">Status</th>
                <th className="text-left p-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-400">
                    {searchTerm ? 'No users found matching your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <React.Fragment key={user.id}>
                    <tr className={`table-row border-b border-white/5 stagger-row ${index % 2 === 0 ? '' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <span className="text-white font-semibold text-sm">
                              {user.full_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-white">{user.full_name}</span>
                        </div>
                        <div className="light-bar"></div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-300">{user.email}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-300">
                          {user.department || '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(user.is_active)}`}>
                          {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-white/5"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.is_active && (
                            <button
                              onClick={() => handleDeactivate(user)}
                              className="p-2 rounded-lg transition-colors text-gray-400 hover:text-red-400 hover:bg-white/5"
                              title="Deactivate user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Edit Row */}
                    {editingUser?.id === user.id && (
                      <tr className={isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}>
                        <td colSpan="6" className="p-4">
                          <div className="space-y-4">
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Edit User: {user.full_name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Role
                                </label>
                                <select
                                  value={editForm.role}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                  className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    isDarkMode 
                                      ? 'bg-gray-700 border border-gray-600 text-white' 
                                      : 'bg-white border border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="employee">Employee</option>
                                  <option value="dept_head">Department Head</option>
                                  <option value="finance">Finance</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Department
                                </label>
                                <input
                                  type="text"
                                  value={editForm.department}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                                  className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    isDarkMode 
                                      ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400' 
                                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                                  }`}
                                  placeholder="Enter department"
                                />
                              </div>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={handleSaveEdit}
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{users.length}</p>
        </div>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Users</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{users.filter(u => u.is_active).length}</p>
        </div>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Admins</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'glass-panel' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Employees</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{users.filter(u => u.role === 'employee').length}</p>
        </div>
      </div>
    </div>
  )
}

export default Users
