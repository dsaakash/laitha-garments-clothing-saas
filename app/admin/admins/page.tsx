'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Admin } from '@/lib/db-auth'

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin' as 'superadmin' | 'admin' | 'user',
    roleId: '' as string | number
  })

  useEffect(() => {
    loadAdmins()
    loadRoles()
  }, [])

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        handleCloseModal()
      }
    }

    if (showModal) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [showModal])

  // Update role fallback when roleId changes
  useEffect(() => {
    if (formData.roleId) {
      const selectedRole = roles.find(r => r.id === parseInt(formData.roleId.toString()))
      if (selectedRole) {
        // Map dynamic roles to legacy roles for backward compatibility
        if (selectedRole.name.toLowerCase().includes('super')) {
          setFormData(prev => ({ ...prev, role: 'superadmin' }))
        } else if (selectedRole.name.toLowerCase() === 'user') {
          setFormData(prev => ({ ...prev, role: 'user' }))
        } else {
          setFormData(prev => ({ ...prev, role: 'admin' }))
        }
      }
    }
  }, [formData.roleId, roles])

  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/admin')
      const result = await response.json()
      if (result.success) {
        setAdmins(result.admins)
      }
    } catch (error) {
      console.error('Failed to load admins:', error)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      const result = await response.json()
      if (result.success) {
        setRoles(result.roles)
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload: any = {
        role: formData.role,
        roleId: formData.roleId ? parseInt(formData.roleId.toString()) : undefined
      }

      if (editingAdmin) {
        // Update role only (password updates would need separate endpoint)
        payload.id = editingAdmin.id
        const response = await fetch('/api/admin', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!result.success) {
          alert(result.message || 'Failed to update admin')
          return
        }
      } else {
        payload.email = formData.email
        payload.password = formData.password
        payload.name = formData.name

        const response = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!result.success) {
          alert(result.message || 'Failed to create admin')
          return
        }
      }

      resetForm()
      await loadAdmins()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save admin:', error)
      alert('Failed to save admin')
    }
  }

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      email: admin.email,
      password: '', // Don't pre-fill password
      name: admin.name || '',
      role: admin.role,
      roleId: admin.role_id || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this admin?')) {
      try {
        const response = await fetch(`/api/admin?id=${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) {
          alert(result.message || 'Failed to delete admin')
          return
        }
        await loadAdmins()
      } catch (error) {
        console.error('Failed to delete admin:', error)
        alert('Failed to delete admin')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'admin',
      roleId: ''
    })
    setEditingAdmin(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'user':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleName = (admin: Admin) => {
    if (admin.role_id) {
      const dynamicRole = roles.find(r => r.id === admin.role_id)
      if (dynamicRole) return dynamicRole.name
    }
    return admin.role
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-gray-600 mt-1">Manage system administrators and their roles</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Add Admin
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {admin.name || 'No name'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{admin.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(admin.role)}`}>
                      {getRoleName(admin)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                {editingAdmin ? 'Edit Admin' : 'Add Admin'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
                {!editingAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required={!editingAdmin}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Role (Auto-derived or Manual)
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-2"
                  >
                    <option value="">Select a Role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>

                  <div className="text-xs text-gray-500">
                    Legacy Access Level: <span className="font-semibold">{formData.role}</span>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingAdmin ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
