'use client';

import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
    Position,
    Handle,
    Background,
    Controls,
    MiniMap,
    NodeMouseHandler,
    Node,
    Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useRouter } from 'next/navigation';
import {
    Factory,
    Tags,
    ShoppingCart,
    Package,
    Users,
    Banknote,
    FileText,
    BookOpen,
    ExternalLink,
    X,
    ArrowRight,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

// Custom Node Component
const ProcessNode = ({ data }: { data: any }) => {
    const Icon = data.icon;

    return (
        <div className={`group relative px-5 py-4 shadow-lg hover:shadow-xl rounded-xl bg-white border transition-all duration-300 min-w-[220px] ${data.isSelected ? 'border-purple-500 ring-2 ring-purple-100' : 'border-slate-200 hover:border-purple-300'}`}>
            <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />

            <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-xl transition-transform duration-300 group-hover:scale-105 ${data.colorClass || 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-base font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                        {data.label}
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                        {data.stats}
                    </div>
                </div>
            </div>

            {/* External Link Icon (Top Right) */}
            <div className="absolute top-3 right-3 text-slate-300 group-hover:text-purple-400 transition-colors">
                <ExternalLink className="w-4 h-4" />
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
        </div>
    );
};

const nodeTypes = {
    process: ProcessNode,
};

// Initial Data
const initialNodes = [
    {
        id: 'suppliers',
        type: 'process',
        data: { label: 'Suppliers', icon: Factory, stats: 'Manage Suppliers', colorClass: 'bg-orange-50 text-orange-600', href: '/admin/suppliers', apiPath: '/api/suppliers' },
        position: { x: 0, y: 0 },
    },
    {
        id: 'categories',
        type: 'process',
        data: { label: 'Categories', icon: Tags, stats: 'Product Categories', colorClass: 'bg-slate-100 text-slate-600', href: '/admin/categories', apiPath: '/api/categories' },
        position: { x: 0, y: 0 },
    },
    {
        id: 'purchases',
        type: 'process',
        data: { label: 'Purchase Orders', icon: ShoppingCart, stats: 'Procurement', colorClass: 'bg-blue-50 text-blue-600', href: '/admin/purchases', apiPath: '/api/purchases' },
        position: { x: 0, y: 0 },
    },
    {
        id: 'inventory',
        type: 'process',
        data: { label: 'Inventory', icon: Package, stats: 'Stock Management', colorClass: 'bg-amber-50 text-amber-600', href: '/admin/inventory', apiPath: '/api/inventory' },
        position: { x: 0, y: 0 },
    },
    {
        id: 'catalogues',
        type: 'process',
        data: { label: 'Catalogues', icon: BookOpen, stats: 'Digital Catalogues', colorClass: 'bg-green-50 text-green-600', href: '/admin/catalogues', apiPath: '/api/catalogues' },
        position: { x: 0, y: 0 },
    },
    {
        id: 'customers',
        type: 'process',
        data: { label: 'Customers', icon: Users, stats: 'CRM', colorClass: 'bg-indigo-50 text-indigo-600', href: '/admin/customers', apiPath: '/api/customers' },
        position: { x: 0, y: 0 },
    },
    {
        id: 'sales',
        type: 'process',
        data: { label: 'Sales', icon: Banknote, stats: 'Orders & Billing', colorClass: 'bg-emerald-50 text-emerald-600', href: '/admin/sales', apiPath: '/api/sales' },
        position: { x: 0, y: 0 },
    },
    {
        id: 'invoices',
        type: 'process',
        data: { label: 'Invoices', icon: FileText, stats: 'Generated Invoices', colorClass: 'bg-slate-50 text-slate-600', href: '/admin/invoices', apiPath: '/api/invoices' },
        position: { x: 0, y: 0 },
    },
];

const initialEdges = [
    { id: 'e1', source: 'suppliers', target: 'purchases', animated: true, label: 'Create PO' },
    { id: 'e2', source: 'categories', target: 'purchases', type: 'smoothstep', style: { strokeDasharray: '5,5' }, label: 'Categorize' },
    { id: 'e3', source: 'purchases', target: 'inventory', animated: true, label: 'Add to Stock' },
    { id: 'e4', source: 'inventory', target: 'customers', type: 'smoothstep', style: { strokeDasharray: '5,5' } },
    { id: 'e5', source: 'inventory', target: 'catalogues', label: 'Organize' },
    { id: 'e6', source: 'customers', target: 'sales', animated: true, label: 'Place Order' },
    { id: 'e7', source: 'sales', target: 'invoices', animated: true, label: 'Generate' },
    { id: 'e8', source: 'catalogues', target: 'sales', type: 'smoothstep', style: { strokeDasharray: '5,5' } },
    { id: 'e9', source: 'inventory', target: 'sales', type: 'smoothstep', style: { strokeDasharray: '5,5' } },
];

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 260;
const nodeHeight = 120;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 80, // Horizontal spacing
        ranksep: 100  // Vertical spacing
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';

        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges
);

// --- Node Details Sidebar Component ---
const NodeDetailsSidebar = ({
    node,
    onClose,
    upstreamNodes,
    downstreamNodes
}: {
    node: Node,
    onClose: () => void,
    upstreamNodes: Node[],
    downstreamNodes: Node[]
}) => {
    const router = useRouter();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (node?.data?.apiPath) {
            fetchData(node.data.apiPath);
        }
    }, [node]);

    const fetchData = async (apiPath: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiPath);
            const result = await res.json();

            if (result.success) {
                // Handle different API response structures
                let items = [];
                if (result.data) {
                    items = Array.isArray(result.data) ? result.data : (result.data.items || []);
                } else if (result.suppliers) items = result.suppliers;
                else if (result.purchases) items = result.purchases;
                else if (result.inventory) items = result.inventory;
                else if (result.sales) items = result.sales;
                else if (result.customers) items = result.customers;
                else if (result.categories) items = result.categories;
                else if (result.catalogues) items = result.catalogues;
                else if (result.invoices) items = result.invoices;

                setData(items.slice(0, 5)); // Take top 5
            } else {
                setError('Failed to load data');
            }
        } catch (err) {
            console.error(err);
            setError('Error loading preview');
        } finally {
            setLoading(false);
        }
    };

    const LinkCard = ({ n, type }: { n: Node, type: 'up' | 'down' }) => {
        const Icon = n.data.icon;
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 mb-2">
                <div className={`p-2 rounded-md ${n.data.colorClass ? n.data.colorClass.split(' ')[0] + ' ' + n.data.colorClass.split(' ')[1] : 'bg-slate-200 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700">{n.data.label}</div>
                </div>
                {type === 'down' ? <ArrowRight className="w-4 h-4 text-slate-400" /> : <ArrowLeft className="w-4 h-4 text-slate-400" />}
            </div>
        );
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${node.data.colorClass || 'bg-slate-100 text-slate-600'}`}>
                        {node.data.icon && <node.data.icon className="w-5 h-5" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{node.data.label} Details</h2>
                        <p className="text-xs text-slate-500">Module Overview</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Relationships Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Relationships
                    </h3>

                    <div className="space-y-4">
                        {upstreamNodes.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                    <ArrowLeft className="w-3 h-3" /> Incoming from
                                </p>
                                {upstreamNodes.map(n => <LinkCard key={n.id} n={n} type="up" />)}
                            </div>
                        )}

                        {downstreamNodes.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" /> Outgoing to
                                </p>
                                {downstreamNodes.map(n => <LinkCard key={n.id} n={n} type="down" />)}
                            </div>
                        )}

                        {upstreamNodes.length === 0 && downstreamNodes.length === 0 && (
                            <p className="text-sm text-slate-400 italic">No direct relationships defined.</p>
                        )}
                    </div>
                </div>

                {/* Data Preview Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Recent Data
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
                    ) : data.length === 0 ? (
                        <div className="p-4 bg-slate-50 text-slate-500 rounded-lg text-sm text-center italic">No records found.</div>
                    ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2 font-medium text-slate-600">ID</th>
                                        <th className="px-3 py-2 font-medium text-slate-600">Name/Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((item, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 text-slate-500 font-mono text-xs">
                                                {item.bill_number ? item.bill_number : (item.id || item._id?.toString().slice(-4))}
                                            </td>
                                            <td className="px-3 py-2 text-slate-800 truncate max-w-[150px]">
                                                {item.name || item.business_name || item.party_name || item.product_name || item.title || 'Record'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                    onClick={() => router.push(node.data.href)}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-200 hover:shadow-purple-300 transform hover:-translate-y-0.5"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open Full {node.data.label} Table
                </button>
            </div>
        </div>
    );
};

export default function WorkflowVisualize() {
    const router = useRouter();
    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    // Selection State
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Handle Node Click
    const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
        // Highlight selected node
        setNodes(nds => nds.map(n => ({
            ...n,
            data: { ...n.data, isSelected: n.id === node.id }
        })));
        setSelectedNode(node);
    }, [setNodes]);

    const closeSidebar = () => {
        setSelectedNode(null);
        setNodes(nds => nds.map(n => ({
            ...n,
            data: { ...n.data, isSelected: false }
        })));
    };

    // Calculate relationships for selected node
    const upstreamNodes = selectedNode ? edges
        .filter(e => e.target === selectedNode.id)
        .map(e => nodes.find(n => n.id === e.source))
        .filter(Boolean) as Node[]
        : [];

    const downstreamNodes = selectedNode ? edges
        .filter(e => e.source === selectedNode.id)
        .map(e => nodes.find(n => n.id === e.target))
        .filter(Boolean) as Node[]
        : [];

    return (
        <AdminLayout>
            <div className="flex h-[calc(100vh-100px)] gap-6 relative overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 h-full">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Business Workflow</h1>
                            <p className="text-gray-500 mt-1">Interactive overview of your business process</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                Auto-Layout
                            </button>
                            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm flex items-center gap-2 shadow-md transition-all hover:shadow-lg">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                Save View
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50/50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden backdrop-blur-sm relative">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            nodeTypes={nodeTypes}
                            fitView
                            attributionPosition="bottom-right"
                            defaultEdgeOptions={{
                                type: 'smoothstep',
                                markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                                style: { stroke: '#94a3b8', strokeWidth: 2 }
                            }}
                        >
                            <Background color="#cbd5e1" gap={24} size={1.5} />
                            <Controls className="bg-white border border-slate-200 shadow-md rounded-lg p-1" />
                            <MiniMap
                                style={{ height: 120, borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}
                                zoomable
                                pannable
                                nodeColor="#9333ea"
                                maskColor="rgba(241, 245, 249, 0.7)"
                            />
                        </ReactFlow>
                    </div>
                </div>

                {/* Sidebar */}
                {selectedNode && (
                    <NodeDetailsSidebar
                        node={selectedNode}
                        onClose={closeSidebar}
                        upstreamNodes={upstreamNodes}
                        downstreamNodes={downstreamNodes}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
