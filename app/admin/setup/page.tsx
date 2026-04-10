'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
import { 
    Wand2, 
    CheckCircle2, 
    Circle, 
    ArrowRight, 
    ArrowLeft, 
    Globe, 
    AtSign, 
    Building2, 
    ShieldCheck, 
    Database, 
    LayoutDashboard,
    Zap,
    ChevronRight,
    Star
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SetupStep {
    id: string
    title: string
    description: string
    isCompleted: boolean
    isActive: boolean
    icon: any
}

export default function SetupWizard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [currentStep, setCurrentStep] = useState(0)
    const [companyInfo, setCompanyInfo] = useState({
        name: '',
        email: '',
        domain: '',
        industry: ''
    })

    const steps: SetupStep[] = [
        {
            id: 'company',
            title: 'Base Identity',
            description: 'Configure your primary organizational profile.',
            isCompleted: true,
            isActive: true,
            icon: Building2
        },
        {
            id: 'domain',
            title: 'Network Control',
            description: 'Secure your custom endpoints and subdomains.',
            isCompleted: false,
            isActive: false,
            icon: Globe
        },
        {
            id: 'security',
            title: 'Security Protocols',
            description: 'Initialize encryption and access governance.',
            isCompleted: false,
            isActive: false,
            icon: ShieldCheck
        },
        {
            id: 'dashboard',
            title: 'System Activation',
            description: 'Deploy the main command interface.',
            isCompleted: false,
            isActive: false,
            icon: LayoutDashboard
        }
    ]

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000)
        return () => clearTimeout(timer)
    }, [])

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-white/5 rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)' }}></div>
                        <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 animate-pulse" style={{ color: 'var(--accent)' }} />
                    </div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-6xl mx-auto py-8 px-4"
            >
                {/* Header Section */}
                <div 
                    className="relative overflow-hidden rounded-[3rem] p-10 shadow-2xl border border-white/5 mb-8"
                    style={{ backgroundColor: 'var(--sidebar-bg)' }}
                >
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 opacity-20 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--accent)' }} />
                    <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 opacity-10 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--accent)' }} />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 rounded-2xl border bg-black/40 border-white/10">
                                <Zap className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tight">System Initialization</h1>
                                <p className="text-lg font-bold text-slate-400 mt-1 uppercase tracking-widest text-[11px]">Command Center Setup Wizard v1.0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Progress Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        <div 
                            className="p-6 rounded-[2.5rem] border backdrop-blur-xl"
                            style={{ 
                                backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.6)',
                                borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.2)'
                            }}
                        >
                            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                                Sequence Progress
                            </h2>
                            <div className="space-y-6">
                                {steps.map((step, index) => {
                                    const Icon = step.icon
                                    const isCurrent = currentStep === index
                                    const isDone = currentStep > index
                                    const isPending = currentStep < index

                                    return (
                                        <div key={step.id} className="relative flex items-start gap-4 group">
                                            {index !== steps.length - 1 && (
                                                <div 
                                                    className="absolute left-[23px] top-[48px] w-0.5 h-[calc(100%-24px)] transition-all duration-500"
                                                    style={{ backgroundColor: isDone ? 'var(--accent)' : 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)' }}
                                                />
                                            )}
                                            
                                            <div className="relative">
                                                <div 
                                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                                                        isCurrent ? 'scale-110 shadow-2xl' : 'scale-100 opacity-60'
                                                    }`}
                                                    style={{ 
                                                        borderColor: (isCurrent || isDone) ? 'var(--accent)' : 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)',
                                                        backgroundColor: isDone ? 'var(--accent)' : 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.5)',
                                                        boxShadow: isCurrent ? '0 0 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4)' : 'none'
                                                    }}
                                                >
                                                    {isDone ? (
                                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                                    ) : (
                                                        <Icon className="w-5 h-5" style={{ color: isCurrent ? 'var(--accent)' : 'white' }} />
                                                    )}
                                                </div>
                                                {isCurrent && (
                                                    <div className="absolute -inset-1 rounded-2xl animate-pulse -z-10" style={{ backgroundColor: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)' }} />
                                                )}
                                            </div>

                                            <div className="pt-1.5">
                                                <p className={`text-sm font-black tracking-tight ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                                                    {step.title}
                                                </p>
                                                <p className="text-[11px] font-bold text-slate-600 line-clamp-1 mt-0.5">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Tip Card */}
                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-[2rem] p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Star className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h4 className="text-sm font-black text-indigo-300 uppercase tracking-widest">Protocol Tip</h4>
                            </div>
                            <p className="text-sm text-indigo-200/60 leading-relaxed font-medium">
                                Complete each phase meticulously. These settings form the backbone of your command infrastructure.
                            </p>
                        </div>
                    </div>

                    {/* Main Configuration Interface */}
                    <div className="lg:col-span-8">
                        <div 
                            className="rounded-[3rem] border shadow-2xl overflow-hidden min-h-[500px] flex flex-col"
                            style={{ 
                                backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.8)',
                                border: '1px solid rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.2)',
                                backdropFilter: 'blur(40px)'
                            }}
                        >
                            <div className="p-12 flex-1">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10"
                                    >
                                        <div>
                                            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                                                {steps[currentStep].title}
                                            </h3>
                                            <p className="text-lg text-slate-400 font-medium">
                                                {steps[currentStep].description}
                                            </p>
                                        </div>

                                        {/* Dynamic Form Content */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Configuration Key</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                        <AtSign className="w-5 h-5 text-slate-600 transition-colors group-focus-within:text-cyan-400" />
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter unique identifier..."
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-cyan-500/50 transition-all placeholder-slate-700"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Input Protocol</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                        <Building2 className="w-5 h-5 text-slate-600 transition-colors group-focus-within:text-cyan-400" />
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Select deployment target..."
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-cyan-500/50 transition-all placeholder-slate-700"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-3xl bg-black/30 border border-white/5 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Database className="w-5 h-5 text-slate-500" />
                                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Initialization State</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-[10px] font-black text-slate-600 uppercase">Operational Density</span>
                                                    <span className="text-xs font-black text-white">45%</span>
                                                </div>
                                                <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div 
                                                        initial={{ width: '0%' }}
                                                        animate={{ width: '45%' }}
                                                        className="h-full rounded-full transition-all shadow-[0_0_10px_rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.5)]"
                                                        style={{ backgroundColor: 'var(--accent)' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-8 px-12 bg-black/40 border-t border-white/5 flex justify-between items-center">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 0}
                                    className="flex items-center gap-2 px-8 py-4 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Previous Phase
                                </button>
                                
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-3 px-10 py-4 text-[10px] text-white font-black rounded-2xl transition-all shadow-2xl hover:scale-105 active:scale-95 uppercase tracking-[0.2em] group"
                                    style={{ 
                                        backgroundColor: 'var(--accent)',
                                        boxShadow: '0 8px 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4)'
                                    }}
                                >
                                    {currentStep === steps.length - 1 ? 'Activate System' : 'Commit & Proceed'}
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AdminLayout>
    )
}
