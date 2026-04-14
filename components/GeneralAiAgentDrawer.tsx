'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Construction, MessageSquare } from 'lucide-react'

interface GeneralAiAgentDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function GeneralAiAgentDrawer({ isOpen, onClose }: GeneralAiAgentDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Assistant</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">In Development</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                <Construction className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Coming Soon!</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                We&apos;re currently training this agent to help you with **Sales, Analytics, and Customer Support**.
              </p>
              
              <div className="mt-8 grid grid-cols-1 gap-3 w-full">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 text-left">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-indigo-900 uppercase">Pro Tip</p>
                    <p className="text-sm text-indigo-700">Check the **Purchases** page to see our live AI Agent in action!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={onClose}
                className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-sm"
              >
                Close Assistant
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
