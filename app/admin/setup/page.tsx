'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { 
    Building2, 
    ShoppingCart, 
    Package, 
    TrendingUp, 
    ArrowRight, 
    CheckCircle2, 
    Clock, 
    Plus,
    MessageSquare,
    Store,
    LayoutDashboard,
    ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SetupStep {
    id: string
    title: string
    description: string
    status: 'pending' | 'completed' | 'active'
    icon: any
    link?: string
    actionLabel?: string
    isAiEnabled?: boolean
}

export default function SetupWizard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [businessData, setBusinessData] = useState<any>(null)
    const [stats, setStats] = useState({
        hasPO: false,
        hasInventory: false,
        hasSales: false
    })
    const [showPurchaseChoice, setShowPurchaseChoice] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Business Profile
                const bizRes = await fetch('/api/business')
                const bizData = await bizRes.json()
                if (bizData.success) setBusinessData(bizData.data)

                // Fetch Stats to determine progress
                const statsRes = await fetch('/api/admin/dashboard/stats') // Hypothetical or check actual stats endpoint
                const statsData = await statsRes.json()
                // Just as an example, we'll mark steps as completed if data exists
                setStats({
                    hasPO: true, // Mocking for now to show visual progress
                    hasInventory: false,
                    hasSales: false
                })
            } catch (err) {
                console.error('Failed to fetch setup data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const openPoAgent = () => {
        window.dispatchEvent(new CustomEvent('toggleAiAgent', { 
            detail: { open: true, type: 'po' } 
        }))
        setShowPurchaseChoice(false)
    }

    const openSetupAgent = () => {
        window.dispatchEvent(new CustomEvent('toggleAiAgent', { 
            detail: { open: true, type: 'setup' } 
        }))
    }

    const steps: SetupStep[] = [
        {
            id: 'business',
            title: 'Step 1: Business Registry',
            description: 'Register your store name, GST number, and clothing-specific details.',
            status: businessData?.businessName ? 'completed' : 'active',
            icon: Building2,
            link: '/admin/business',
            actionLabel: 'Complete Profile'
        },
        {
            id: 'purchases',
            title: 'Step 2: Create Purchase Order',
            description: 'Source your first batch of garments. You can build your order manually or use AI.',
            status: stats.hasPO ? 'active' : 'pending',
            icon: ShoppingCart,
            actionLabel: 'Create Order'
        },
        {
            id: 'inventory',
            title: 'Step 3: Inventory Verification',
            description: 'Verify your received stock and assign them to physical racks in your store.',
            status: 'pending',
            icon: Package,
            link: '/admin/inventory',
            actionLabel: 'Check Stock'
        },
        {
            id: 'sales',
            title: 'Step 4: Sales & Invoices',
            description: 'Start selling! Generate your first customer invoice and track your revenue.',
            status: 'pending',
            icon: TrendingUp,
            link: '/admin/sales',
            actionLabel: 'Start Selling'
        }
    ]

    const completedSteps = steps.filter(s => s.status === 'completed').length
    const progress = (completedSteps / steps.length) * 100

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto py-8">
                {/* Header Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                                Setup your {businessData?.businessName || 'Garment Store'}
                            </h1>
                            <p className="text-slate-500 font-medium">Follow these steps to get your internal tool ready for operations.</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="text-sm font-black text-indigo-600 uppercase tracking-widest">{Math.round(progress)}% Complete</div>
                            <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workflow Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`group bg-white rounded-[2rem] p-8 border-2 transition-all duration-300 ${
                                step.status === 'active' 
                                    ? 'border-indigo-500 shadow-xl shadow-indigo-100' 
                                    : step.status === 'completed'
                                    ? 'border-emerald-100 bg-emerald-50/20'
                                    : 'border-slate-100 hover:border-slate-200 shadow-sm'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                    step.status === 'active' 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' 
                                        : step.status === 'completed'
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                        : 'bg-slate-100 text-slate-400'
                                }`}>
                                    <step.icon size={28} />
                                </div>
                                {step.status === 'completed' && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle2 size={12} />
                                        Completed
                                    </div>
                                )}
                                {step.status === 'active' && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <Clock size={12} className="animate-spin-slow" />
                                        Current Step
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{step.title}</h3>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
                                {step.description}
                            </p>

                            <div className="flex flex-col gap-3">
                                {step.id === 'purchases' ? (
                                    <div className="space-y-4">
                                        {!showPurchaseChoice || step.status === 'completed' ? (
                                            <button
                                                onClick={() => {
                                                    if (step.status === 'completed') {
                                                        router.push('/admin/purchases')
                                                    } else {
                                                        setShowPurchaseChoice(true)
                                                    }
                                                }}
                                                className={`w-full py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
                                                    step.status === 'completed'
                                                        ? 'bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                                                        : 'bg-indigo-600 text-white shadow-lg hover:shadow-indigo-200'
                                                }`}
                                            >
                                                <span>{step.status === 'completed' ? 'View Orders' : step.actionLabel}</span>
                                                {step.status === 'completed' ? <ExternalLink size={18} /> : <Plus size={18} />}
                                            </button>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <button
                                                    onClick={openPoAgent}
                                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 text-sm"
                                                >
                                                    <MessageSquare size={16} />
                                                    Use AI Assistant
                                                </button>
                                                <button
                                                    onClick={() => router.push('/admin/purchases?new=true')}
                                                    className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 active:scale-95 text-sm"
                                                >
                                                    <Plus size={16} />
                                                    Manual Form
                                                </button>
                                                <button 
                                                    onClick={() => setShowPurchaseChoice(false)}
                                                    className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                                >
                                                    Go Back
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : step.isAiEnabled ? (
                                    <button
                                        onClick={openPoAgent}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 group/btn active:scale-95"
                                    >
                                        <MessageSquare size={18} className="group-hover/btn:animate-pulse" />
                                        <span>{step.actionLabel}</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => step.link && router.push(step.link)}
                                        className={`w-full py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
                                            step.status === 'completed'
                                                ? 'bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                                                : 'bg-indigo-600 text-white shadow-lg hover:shadow-indigo-200'
                                        }`}
                                    >
                                        <span>{step.actionLabel}</span>
                                        <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Shortcuts */}
                <div className="mt-12">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 pl-4">Operational Shortcuts</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Control Center', icon: LayoutDashboard, link: '/admin/dashboard' },
                            { label: 'Manage Store', icon: Store, link: '/admin/business' },
                            { label: 'View Inventory', icon: Package, link: '/admin/inventory' },
                            { label: 'AI Helper', icon: MessageSquare, action: openSetupAgent }
                        ].map((item, i) => (
                            <div 
                                key={i}
                                onClick={() => item.action ? item.action() : item.link && router.push(item.link)}
                                className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                    <item.icon size={16} className="text-slate-500 group-hover:text-indigo-600" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </AdminLayout>
    )
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
