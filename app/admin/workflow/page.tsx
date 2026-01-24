'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import AdminLayout from '@/components/AdminLayout'
import PageHeader from '@/components/PageHeader'
import ActionButton from '@/components/ActionButton'
import { Download, Save, LayoutGrid } from 'lucide-react'
import ProcessNode from '@/components/workflow/ProcessNode'

// Define node types
const nodeTypes = {
    process: ProcessNode,
}

// Initial nodes representing your business processes
const initialNodes: Node[] = [
    {
        id: 'suppliers',
        type: 'process',
        position: { x: 100, y: 50 },
        data: {
            label: 'Suppliers',
            icon: '🏭',
            count: 0,
            route: '/admin/suppliers'
        },
    },
    {
        id: 'categories',
        type: 'process',
        position: { x: 400, y: 50 },
        data: {
            label: 'Categories',
            icon: '📑',
            count: 0,
            route: '/admin/categories'
        },
    },
    {
        id: 'purchases',
        type: 'process',
        position: { x: 100, y: 200 },
        data: {
            label: 'Purchase Orders',
            icon: '🛒',
            count: 0,
            route: '/admin/purchases'
        },
    },
    {
        id: 'inventory',
        type: 'process',
        position: { x: 100, y: 350 },
        data: {
            label: 'Inventory',
            icon: '📦',
            count: 0,
            route: '/admin/inventory'
        },
    },
    {
        id: 'catalogues',
        type: 'process',
        position: { x: 400, y: 350 },
        data: {
            label: 'Catalogues',
            icon: '📚',
            count: 0,
            route: '/admin/catalogues'
        },
    },
    {
        id: 'customers',
        type: 'process',
        position: { x: 100, y: 500 },
        data: {
            label: 'Customers',
            icon: '👥',
            count: 0,
            route: '/admin/customers'
        },
    },
    {
        id: 'sales',
        type: 'process',
        position: { x: 250, y: 650 },
        data: {
            label: 'Sales',
            icon: '💰',
            count: 0,
            route: '/admin/sales'
        },
    },
    {
        id: 'invoices',
        type: 'process',
        position: { x: 450, y: 650 },
        data: {
            label: 'Invoices',
            icon: '📄',
            count: 0,
            route: '/admin/invoices'
        },
    },
]

// Initial edges (connections between processes)
const initialEdges: Edge[] = [
    {
        id: 'suppliers-purchases',
        source: 'suppliers',
        target: 'purchases',
        label: 'Create PO',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
        id: 'purchases-inventory',
        source: 'purchases',
        target: 'inventory',
        label: 'Add to Stock',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
        id: 'inventory-catalogues',
        source: 'inventory',
        target: 'catalogues',
        label: 'Organize',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
        id: 'categories-inventory',
        source: 'categories',
        target: 'inventory',
        label: 'Categorize',
        type: 'smoothstep',
        animated: false,
        style: { strokeDasharray: '5,5' },
        markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
        id: 'customers-sales',
        source: 'customers',
        target: 'sales',
        label: 'Place Order',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
        id: 'inventory-sales',
        source: 'inventory',
        target: 'sales',
        label: 'Fulfill Order',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
        id: 'sales-invoices',
        source: 'sales',
        target: 'invoices',
        label: 'Generate',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
    },
]

export default function WorkflowPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
    const [loading, setLoading] = useState(true)

    // Fetch real data counts from APIs
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [
                    suppliersRes,
                    categoriesRes,
                    purchasesRes,
                    inventoryRes,
                    cataloguesRes,
                    customersRes,
                    salesRes,
                ] = await Promise.all([
                    fetch('/api/suppliers'),
                    fetch('/api/categories'),
                    fetch('/api/purchases'),
                    fetch('/api/inventory'),
                    fetch('/api/catalogues'),
                    fetch('/api/customers'),
                    fetch('/api/sales'),
                ])

                const [
                    suppliers,
                    categories,
                    purchases,
                    inventory,
                    catalogues,
                    customers,
                    sales,
                ] = await Promise.all([
                    suppliersRes.json(),
                    categoriesRes.json(),
                    purchasesRes.json(),
                    inventoryRes.json(),
                    cataloguesRes.json(),
                    customersRes.json(),
                    salesRes.json(),
                ])

                // Update node counts
                setNodes((nds) =>
                    nds.map((node) => {
                        switch (node.id) {
                            case 'suppliers':
                                return { ...node, data: { ...node.data, count: suppliers.data?.length || 0 } }
                            case 'categories':
                                return { ...node, data: { ...node.data, count: categories.data?.length || 0 } }
                            case 'purchases':
                                return { ...node, data: { ...node.data, count: purchases.data?.length || 0 } }
                            case 'inventory':
                                return { ...node, data: { ...node.data, count: inventory.data?.length || 0 } }
                            case 'catalogues':
                                return { ...node, data: { ...node.data, count: catalogues.data?.length || 0 } }
                            case 'customers':
                                return { ...node, data: { ...node.data, count: customers.data?.length || 0 } }
                            case 'sales':
                                return { ...node, data: { ...node.data, count: sales.data?.length || 0 } }
                            case 'invoices':
                                // Invoices count is same as sales (one invoice per sale)
                                return { ...node, data: { ...node.data, count: sales.data?.length || 0 } }
                            default:
                                return node
                        }
                    })
                )
            } catch (error) {
                console.error('Failed to fetch workflow data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCounts()
    }, [setNodes])

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    const handleSave = () => {
        console.log('Saving workflow...', { nodes, edges })
        alert('Workflow saved!')
    }

    const handleAutoLayout = () => {
        alert('Auto-layout coming soon!')
    }

    const handleExport = () => {
        alert('Export coming soon!')
    }

    return (
        <AdminLayout>
            <div className="h-screen flex flex-col">
                <PageHeader
                    title="Business Workflow"
                    description="Visualize and automate your business processes"
                    action={
                        <div className="flex gap-3">
                            <ActionButton
                                icon={LayoutGrid}
                                variant="secondary"
                                onClick={handleAutoLayout}
                                size="sm"
                            >
                                Auto-Layout
                            </ActionButton>
                            <ActionButton
                                icon={Download}
                                variant="secondary"
                                onClick={handleExport}
                                size="sm"
                            >
                                Export
                            </ActionButton>
                            <ActionButton
                                icon={Save}
                                variant="primary"
                                onClick={handleSave}
                                size="sm"
                            >
                                Save
                            </ActionButton>
                        </div>
                    }
                />

                {/* React Flow Canvas */}
                <div className="flex-1 bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
                                <p className="text-gray-600 font-medium">Loading workflow data...</p>
                            </div>
                        </div>
                    )}

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-white"
                    >
                        <Controls />
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    </ReactFlow>
                </div>

                {/* Helper Text */}
                <div className="mt-4 text-center text-sm text-gray-500">
                    <p>
                        Drag nodes to reposition • Click connections to add automation rules •
                        Click nodes to navigate to that page
                    </p>
                </div>
            </div>
        </AdminLayout>
    )
}
