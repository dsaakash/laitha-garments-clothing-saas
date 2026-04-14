'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Bot } from 'lucide-react'
import AIChatSetup from './AIChatSetup'

interface AIChatSetupDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIChatSetupDrawer({ isOpen, onClose }: AIChatSetupDrawerProps) {
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
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white">Setup Assistant</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-purple-100 uppercase tracking-widest">Active System Activation</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Using the existing AIChatSetup component */}
            <div className="flex-1 overflow-hidden relative">
                {/* We wrap it in a container that allows the component to define its own scrolling if it needs to, 
                    but here we want the component to occupy the available space. */}
                <div className="h-full overflow-y-auto p-4 custom-setup-chat-container">
                    <AIChatSetup />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Powered by Groq & Llama 3</p>
            </div>
          </motion.div>
          
          <style jsx global>{`
            .custom-setup-chat-container > div {
                height: 100% !important;
                max-height: none !important;
                border: none !important;
                box-shadow: none !important;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  )
}
