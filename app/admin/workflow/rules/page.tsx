'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react'

interface Role {
    id: number
    name: string
}

interface WorkflowRule {
    id?: number
    module: string
    trigger_type: 'amount_gt' | 'always'
    trigger_value?: number
    action: 'approval_required' | 'notify'
    approver_role_id: number
    approver_role_name?: string
    is_active: boolean
}

export default function WorkflowConfigPage() {
    const [workflows, setWorkflows] = useState<WorkflowRule[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newRule, setNewRule] = useState<Partial<WorkflowRule>>({
        module: 'purchases',
        trigger_type: 'amount_gt',
        action: 'approval_required',
        is_active: true
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [workflowsRes, rolesRes] = await Promise.all([
                fetch('/api/workflow-config'),
                fetch('/api/roles')
            ])

            if (workflowsRes.ok) {
                const data = await workflowsRes.json()
                setWorkflows(data.workflows)
            }

            if (rolesRes.ok) {
                const data = await rolesRes.json()
                setRoles(data.roles)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveRule = async () => {
        if (!newRule.approver_role_id) {
            alert('Please select an approver role')
            return
        }

        try {
            const res = await fetch('/api/workflow-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRule)
            })

            if (res.ok) {
                setShowAddModal(false)
                fetchData()
                setNewRule({
                    module: 'purchases',
                    trigger_type: 'amount_gt',
                    action: 'approval_required',
                    is_active: true
                })
            } else {
                alert('Failed to save rule')
            }
        } catch (error) {
            console.error('Error saving rule:', error)
        }
    }

    const handleDeleteRule = async (id: number) => {
        if (!confirm('Are you sure you want to delete this rule?')) return

        try {
            const res = await fetch(`/api/workflow-config?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Error deleting rule:', error)
        }
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Workflow Configuration</h1>
                        <p className="text-gray-600">Define approval rules and automation workflows</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Rule
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Module</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Approver</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {workflows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No workflow rules defined yet.
                                        </td>
                                    </tr>
                                ) : (
                                    workflows.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium capitalize">{rule.module}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {rule.trigger_type === 'amount_gt'
                                                    ? `Amount > ₹${rule.trigger_value?.toLocaleString()}`
                                                    : 'Always'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                    {rule.action.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {rule.approver_role_name || 'Unknown Role'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {rule.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => rule.id && handleDeleteRule(rule.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold mb-4">Add Workflow Rule</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        value={newRule.module}
                                        onChange={(e) => setNewRule({ ...newRule, module: e.target.value })}
                                    >
                                        <option value="purchases">Purchases</option>
                                        <option value="sales">Sales</option>
                                        <option value="inventory">Inventory</option>
                                        <option value="enquiries">Enquiries</option>
                                        <option value="catalogues">Catalogues</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition Type</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        value={newRule.trigger_type}
                                        onChange={(e) => setNewRule({ ...newRule, trigger_type: e.target.value as any })}
                                    >
                                        <option value="amount_gt">Amount Greater Than</option>
                                        <option value="always">Always Trigger</option>
                                    </select>
                                </div>

                                {newRule.trigger_type === 'amount_gt' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Threshold Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded-lg p-2"
                                            value={newRule.trigger_value || ''}
                                            onChange={(e) => setNewRule({ ...newRule, trigger_value: parseFloat(e.target.value) })}
                                            placeholder="e.g. 10000"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        value={newRule.action}
                                        onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                                    >
                                        <option value="approval_required">Require Approval</option>
                                        <option value="notify">Notify Only (Coming Soon)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Approver Role</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        value={newRule.approver_role_id || ''}
                                        onChange={(e) => setNewRule({ ...newRule, approver_role_id: parseInt(e.target.value) })}
                                    >
                                        <option value="">Select Role...</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveRule}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Save Rule
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
