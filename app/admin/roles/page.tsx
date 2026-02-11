'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Trash2, Edit, Save, X, Check } from 'lucide-react'

interface Permission {
    resource: string
    actions: string[]
}

interface Role {
    id: number
    name: string
    description: string
    permissions: Record<string, string[]> // { "inventory": ["read", "write"] }
    tenant_id: string | null
}

const RESOURCES = [
    'dashboard', 'suppliers', 'purchases', 'inventory', 'customers',
    'products', 'catalogues', 'sales', 'invoices', 'business',
    'enquiries', 'admins', 'users', 'roles', 'workflow', 'categories'
]

const ACTIONS = ['read', 'write', 'delete', 'manage']

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: {} as Record<string, string[]>
    })

    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/roles')
            const data = await res.json()
            if (data.success) {
                setRoles(data.roles)
            }
        } catch (error) {
            console.error('Error fetching roles:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (role: Role) => {
        setEditingRole(role)
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || {}
        })
        setShowModal(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this role?')) return

        try {
            const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                fetchRoles()
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.error('Error deleting role:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles'
            const method = editingRole ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (data.success) {
                setShowModal(false)
                fetchRoles()
                resetForm()
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.error('Error saving role:', error)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            permissions: {}
        })
        setEditingRole(null)
    }

    const togglePermission = (resource: string, action: string) => {
        setFormData(prev => {
            const currentActions = prev.permissions[resource] || []
            let newActions

            if (currentActions.includes(action)) {
                newActions = currentActions.filter(a => a !== action)
            } else {
                newActions = [...currentActions, action]
            }

            // Clean up empty resources
            const newPermissions = { ...prev.permissions }
            if (newActions.length > 0) {
                newPermissions[resource] = newActions
            } else {
                delete newPermissions[resource]
            }

            return { ...prev, permissions: newPermissions }
        })
    }

    return (
        <AdminLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
                    <p className="text-gray-500 mt-1">Manage custom roles and access rights.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true) }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Create Role
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">{role.name}</h3>
                                <p className="text-sm text-gray-500">{role.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(role)}
                                    className="text-gray-400 hover:text-purple-600 p-1"
                                >
                                    <Edit size={18} />
                                </button>
                                {role.tenant_id !== null && ( // Prevent deleting system roles
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Access Rights</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(role.permissions).length === 0 ? (
                                    <span className="text-sm text-gray-400 italic">No specific permissions</span>
                                ) : (
                                    Object.entries(role.permissions).slice(0, 5).map(([resource, actions]) => (
                                        <span key={resource} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-100">
                                            {resource}: {actions.join(', ')}
                                        </span>
                                    ))
                                )}
                                {Object.keys(role.permissions).length > 5 && (
                                    <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
                                        +{Object.keys(role.permissions).length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="roleForm" onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="e.g. Sales Manager"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="Brief description of responsibilities"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-700 font-medium">
                                                <tr>
                                                    <th className="px-4 py-3">Resource / Module</th>
                                                    {ACTIONS.map(action => (
                                                        <th key={action} className="px-4 py-3 text-center capitalize">{action}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {RESOURCES.map(resource => (
                                                    <tr key={resource} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900 capitalize">
                                                            {resource.replace('_', ' ')}
                                                        </td>
                                                        {ACTIONS.map(action => {
                                                            const isChecked = formData.permissions[resource]?.includes(action) || false
                                                            return (
                                                                <td key={action} className="px-4 py-3 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => togglePermission(resource, action)}
                                                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                                                                    />
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="roleForm"
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Role
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
