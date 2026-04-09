import React, { useState, useEffect } from 'react'
import { Edit, Trash2, Search, User as UserIcon } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import { useToast } from '../components/shared/Toast'
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
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      finance: 'bg-green-500/20 text-green-400 border-green-500/30',
      dept_head: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      employee: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return colors[role] || colors.employee
  }

  const getStatusBadgeColor = (isActive) => {
    return isActive
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30'
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
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Users Management</h1>
        <p className="text-gray-400">Manage system users and their permissions</p>
      </div>

      {/* Search */}
      <div className="glass-panel p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4 text-gray-400 font-medium">User</th>
                <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                <th className="text-left p-4 text-gray-400 font-medium">Department</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
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
                filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-white font-medium">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300 text-sm">{user.email}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300 text-sm">
                          {user.department || '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getStatusBadgeColor(user.is_active)}`}>
                          {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.is_active && (
                            <button
                              onClick={() => handleDeactivate(user)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
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
                      <tr className="bg-gray-800/50">
                        <td colSpan="6" className="p-4">
                          <div className="space-y-4">
                            <h4 className="text-white font-medium">Edit User: {user.full_name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Role
                                </label>
                                <select
                                  value={editForm.role}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                  <option value="employee">Employee</option>
                                  <option value="dept_head">Department Head</option>
                                  <option value="finance">Finance</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Department
                                </label>
                                <input
                                  type="text"
                                  value={editForm.department}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
        <div className="glass-panel p-4">
          <p className="text-gray-400 text-sm">Total Users</p>
          <p className="text-white text-xl font-bold">{users.length}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-gray-400 text-sm">Active Users</p>
          <p className="text-white text-xl font-bold">{users.filter(u => u.is_active).length}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-gray-400 text-sm">Admins</p>
          <p className="text-white text-xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-gray-400 text-sm">Employees</p>
          <p className="text-white text-xl font-bold">{users.filter(u => u.role === 'employee').length}</p>
        </div>
      </div>
    </div>
  )
}

export default Users
