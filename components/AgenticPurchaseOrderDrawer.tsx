'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, X, Sparkles,
  Image as ImageIcon, Loader2,
  AlertCircle, ChevronRight, Package, IndianRupee,
  Mic, MicOff
} from 'lucide-react'
import Image from 'next/image'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  images?: string[]
}

interface AgenticPurchaseOrderDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AgenticPurchaseOrderDrawer({ 
  isOpen, 
  onClose, 
  onSuccess 
}: AgenticPurchaseOrderDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your **AI Purchase Order Agent** 🤖\n\nI'll guide you step-by-step to create a new purchase order.\n\nLet's start — what is the **name of the Supplier** you're purchasing from?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [poCreated, setPoCreated] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // Reset when drawer re-opens
  useEffect(() => {
    if (isOpen) {
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm your **AI Purchase Order Agent** 🤖\n\nI'll guide you step-by-step to create a new purchase order.\n\nLet's start — what is the **name of the Supplier** you're purchasing from?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setPoCreated(false)
      setInput('')
      setPendingImages([])
    }
  }, [isOpen])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading, pendingImages])

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && (window.webkitSpeechRecognition || window.SpeechRecognition)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInput(prev => prev + event.results[i][0].transcript)
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (err) {
        console.error('Failed to start recognition:', err)
      }
    }
  }

  const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault()
    const messageText = customInput ?? input
    if ((!messageText.trim() && pendingImages.length === 0) || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setPendingImages([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/purchase-order-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.images ? `${m.content} [Uploaded Images: ${m.images.join(', ')}]` : m.content 
          })) 
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.message)
      
      let assistantContent: string = data.data.content

      // ─── Handle PO_JSON ───────────────────────────────────────
      if (assistantContent.includes('<PO_JSON>')) {
        const jsonMatch = assistantContent.match(/<PO_JSON>([\s\S]*?)<\/PO_JSON>/)
        if (jsonMatch?.[1]) {
          try {
            const poData = JSON.parse(jsonMatch[1].trim())

            // If new supplier, create it first
            if (poData.isNewSupplier && poData.supplierName && poData.supplierPhone) {
              await createSupplier(poData.supplierName, poData.supplierPhone)
            }

            await createPurchaseOrder(poData)
            setPoCreated(true)
            onSuccess()
            
            // Dispatch event so other pages (like Purchases) can refresh
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('purchaseOrderCreated'))
            }

            // Strip the raw JSON block from the displayed message
            assistantContent = assistantContent.replace(/<PO_JSON>[\s\S]*?<\/PO_JSON>/g, '').trim()
          } catch (err) {
            console.error('Failed to create PO:', err)
            assistantContent = '❌ There was an error saving the Purchase Order. Please try again.'
          }
        }
      }

      // ─── Handle INVENTORY_JSON ────────────────────────────────
      if (assistantContent.includes('<INVENTORY_JSON>')) {
        const jsonMatch = assistantContent.match(/<INVENTORY_JSON>([\s\S]*?)<\/INVENTORY_JSON>/)
        if (jsonMatch?.[1]) {
          try {
            const invData = JSON.parse(jsonMatch[1].trim())
            await updateInventoryPrices(invData)
            assistantContent = assistantContent.replace(/<INVENTORY_JSON>[\s\S]*?<\/INVENTORY_JSON>/g, '').trim()
          } catch (err) {
            console.error('Failed to update inventory prices:', err)
            assistantContent = assistantContent.replace(/<INVENTORY_JSON>[\s\S]*?<\/INVENTORY_JSON>/g, '').trim()
            assistantContent += '\n\n⚠️ Could not update selling prices automatically. Please update them in the Inventory section.'
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])

    } catch (error) {
      console.error('Failed to get AI response:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize — I encountered an error. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const createSupplier = async (name: string, phone: string) => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    })
    const result = await res.json()
    if (!result.success) console.warn('Supplier creation warning:', result.message)
    return result
  }

  const createPurchaseOrder = async (poData: any) => {
    const payload = {
      date: poData.date || new Date().toISOString().split('T')[0],
      supplierName: poData.supplierName,
      items: poData.items.map((item: any) => ({
        productName: item.productName,
        category: item.category || 'Custom',
        sizes: item.sizes || [],
        fabricType: item.fabricType || '',
        quantity: Number(item.quantity) || 0,
        pricePerPiece: Number(item.pricePerPiece) || 0,
        totalAmount: Number(item.totalAmount) || (Number(item.quantity) * Number(item.pricePerPiece)),
        productImages: []
      })),
      gstType: poData.gstType || 'percentage',
      gstPercentage: Number(poData.gstPercentage) || 0,
      gstAmountRupees: Number(poData.gstAmountRupees) || 0,
      transportCharges: Number(poData.transportCharges) || 0,
      notes: poData.notes || '',
      restockInventory: true
    }

    const response = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const result = await response.json()
    if (!result.success) throw new Error(result.message)
    return result
  }

  const updateInventoryPrices = async (invData: any) => {
    // Update each item's selling price in inventory by searching by product name
    for (const item of invData.items) {
      try {
        // Find inventory item by name and update its selling price
        const searchRes = await fetch(`/api/inventory?search=${encodeURIComponent(item.productName)}`)
        const searchResult = await searchRes.json()
        if (searchResult.success && searchResult.data?.length > 0) {
          const inventoryItem = searchResult.data[0]
          await fetch(`/api/inventory/${inventoryItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selling_price: item.sellingPrice })
          })
        }
      } catch (err) {
        console.warn(`Could not update price for ${item.productName}:`, err)
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.success) uploadedUrls.push(data.url)
      }
      setPendingImages(prev => [...prev, ...uploadedUrls])
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl h-full sm:h-[90vh] bg-white sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-l sm:border border-slate-200"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI Purchase Agent</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {poCreated ? 'PO Created ✓' : 'Listening...'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[88%] ${m.role === 'assistant' ? 'flex gap-2.5' : ''}`}>
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 mt-1">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm text-[14px] leading-relaxed whitespace-pre-wrap ${
                          m.role === 'assistant'
                            ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                            : 'bg-indigo-600 text-white rounded-tr-none'
                        }`}
                      >
                        {m.content}
                        {m.images && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {m.images.map((img, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20">
                                <Image src={img} alt="Uploaded" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`text-[10px] mt-1 font-medium px-1 ${m.role === 'assistant' ? 'text-slate-400' : 'text-right text-indigo-300'}`}>
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pending Images Strip */}
            <AnimatePresence>
              {pendingImages.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex gap-2 overflow-x-auto"
                >
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest self-center shrink-0">Attached:</span>
                  {pendingImages.map((img, idx) => (
                    <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 group border border-indigo-200">
                      <Image src={img} alt="Pending" fill className="object-cover" />
                      <button 
                        onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {isUploading && (
                    <div className="w-14 h-14 rounded-lg bg-white border border-dashed border-indigo-300 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendMessage}>
                <div className="flex items-end gap-2 bg-slate-50 border-2 border-slate-200 rounded-2xl p-2 focus-within:border-indigo-400 transition-all">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Upload product/invoice image"
                    className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*"
                  />

                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2.5 transition-all shrink-0 rounded-xl ${
                      isListening 
                        ? 'text-red-600 bg-red-50 animate-pulse scale-110' 
                        : 'text-slate-400 hover:text-indigo-600'
                    }`}
                    title={isListening ? 'Stop recording' : 'Start voice typing'}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your reply..."
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="flex-1 bg-transparent border-none focus:ring-0 py-2 px-1 text-slate-800 placeholder:text-slate-400 text-[14px] font-medium resize-none max-h-28"
                    disabled={isLoading}
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all disabled:opacity-40 shrink-0"
                    disabled={isLoading || (!input.trim() && pendingImages.length === 0)}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </form>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Suppliers checked for duplicates automatically
                </span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" /> Selling price calculated on confirmation
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
