'use client'

/**
 * Edit Workflow Modal
 * 
 * Presents two workflow options for editing a purchase order:
 * 1. Update Specific Products - Search and select specific products
 * 2. Update All Products - Traditional full edit form
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Edit3 } from 'lucide-react'
import { PurchaseOrder } from '@/lib/storage'

interface EditWorkflowModalProps {
    purchaseOrder: PurchaseOrder
    onClose: () => void
    onSelectWorkflow: (workflow: 'selective' | 'full') => void
}

export default function EditWorkflowModal({
    purchaseOrder,
    onClose,
    onSelectWorkflow
}: EditWorkflowModalProps) {
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Edit Purchase Order</h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {purchaseOrder.customPoNumber || `PO-${purchaseOrder.id}`}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-slate-300 mb-6">
                            Choose how you want to edit this purchase order:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Option 1: Update Specific Products */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectWorkflow('selective')}
                                className="group relative p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border-2 border-emerald-500/30 hover:border-emerald-500/50 rounded-xl transition-all text-left"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                        <Search className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            Update Specific Products
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            Search and select specific products to update. Perfect for targeted changes without affecting other products.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                    <span>Search & Select</span>
                                    <span>→</span>
                                </div>
                            </motion.button>

                            {/* Option 2: Update All Products */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectWorkflow('full')}
                                className="group relative p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-2 border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all text-left"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                                        <Edit3 className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            Update All Products
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            Traditional edit form with all products. Use this for comprehensive updates across the entire order.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium">
                                    <span>Full Edit</span>
                                    <span>→</span>
                                </div>
                            </motion.button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
