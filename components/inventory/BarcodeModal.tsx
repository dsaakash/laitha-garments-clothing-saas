'use client'

import React, { useRef, useCallback } from 'react'
import Barcode from 'react-barcode'
import { useReactToPrint } from 'react-to-print'
import { InventoryItem } from '@/lib/storage'
import { X, Printer, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BarcodeModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  storeName?: string
}

// The printable sticker layout — rendered in a hidden but printable area
const BarcodePrintContent = React.forwardRef<
  HTMLDivElement,
  { item: InventoryItem; storeName: string; quantity: number }
>(({ item, storeName, quantity }, ref) => {
  const stickers = Array.from({ length: quantity })

  return (
    <div
      ref={ref}
      style={{
        background: '#fff',
        padding: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'flex-start',
      }}
    >
      {stickers.map((_, i) => (
        <div
          key={i}
          style={{
            border: '1.5px solid #1e1b4b',
            borderRadius: '8px',
            padding: '10px 12px',
            width: '230px',
            background: '#fff',
            fontFamily: 'Arial, sans-serif',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          {/* Store Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e1b4b', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {storeName}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>Garments &amp; Textiles</div>
          </div>

          {/* Product Name */}
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', textAlign: 'center', lineHeight: '1.3' }}>
            {item.dressName}
          </div>

          {/* Barcode SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
            <Barcode
              value={item.dressCode || item.id.toString()}
              width={1.4}
              height={50}
              fontSize={10}
              margin={0}
              displayValue={true}
            />
          </div>

          {/* Dress Code + Type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '8px', color: '#475569', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>
              {item.dressType}
            </span>
            {item.sizes && item.sizes.length > 0 && (
              <span style={{ fontSize: '8px', color: '#475569', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>
                S: {item.sizes.join(',')}
              </span>
            )}
          </div>

          {/* Price */}
          <div style={{ marginTop: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MRP</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e1b4b' }}>
                ₹{item.sellingPrice.toLocaleString()}
              </div>
            </div>
            {item.wholesalePrice && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>WSP</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                  ₹{item.wholesalePrice.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})
BarcodePrintContent.displayName = 'BarcodePrintContent'

export default function BarcodeModal({ item, isOpen, onClose, storeName = 'Lalitha Garments' }: BarcodeModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [quantity, setQuantity] = React.useState(1)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcode_${item?.dressCode || item?.id}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body { margin: 0; }
      }
    `,
  })

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  if (!item) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: 'rgba(15,23,42,0.97)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <Package className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Barcode Generator</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Generate &amp; print product barcode</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barcode Preview */}
            <div className="px-8 pb-6">
              {/* Preview Card */}
              <div
                className="rounded-2xl p-5 mb-5 flex flex-col items-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {/* Store name */}
                <div className="text-center mb-3">
                  <div className="text-sm font-black text-white tracking-[0.15em] uppercase">{storeName}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Garments &amp; Textiles</div>
                </div>

                {/* Product Name */}
                <div className="text-base font-bold text-slate-200 mb-3 text-center">{item.dressName}</div>

                {/* Barcode */}
                <div className="bg-white rounded-xl p-3">
                  <Barcode
                    value={item.dressCode || item.id.toString()}
                    width={1.8}
                    height={60}
                    fontSize={12}
                    margin={0}
                    displayValue={true}
                  />
                </div>

                {/* Code + Type */}
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/20">
                    {item.dressCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10">
                    {item.dressType}
                  </span>
                </div>

                {/* Price Row */}
                <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 w-full justify-center">
                  <div className="text-center">
                    <div className="text-slate-500 text-[9px] uppercase tracking-widest">MRP</div>
                    <div className="text-xl font-black text-white">₹{item.sellingPrice.toLocaleString()}</div>
                  </div>
                  {item.wholesalePrice && (
                    <div className="text-center">
                      <div className="text-slate-500 text-[9px] uppercase tracking-widest">WSP</div>
                      <div className="text-base font-bold text-slate-400">₹{item.wholesalePrice.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-5">
                <label className="text-slate-400 text-sm font-medium flex-shrink-0">Print Quantity</label>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:bg-white/10 transition-all font-bold text-lg border border-white/10"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-white font-black text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(50, q + 1))}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:bg-white/10 transition-all font-bold text-lg border border-white/10"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Print Button */}
              <button
                onClick={() => handlePrint()}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                }}
              >
                <Printer className="w-5 h-5" />
                Print {quantity} Barcode{quantity > 1 ? 's' : ''}
              </button>
            </div>

            {/* Hidden print content */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
              <BarcodePrintContent
                ref={printRef}
                item={item}
                storeName={storeName}
                quantity={quantity}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
