'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, CheckCircle, Edit3, Sparkles, Loader2, KeyRound, Mic, MicOff } from 'lucide-react'

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

interface BusinessProfile {
    businessName: string
    ownerName: string
    email: string
    phone: string
    whatsappNumber: string
    address: string
    gstNumber: string
}

function extractJSON(text: string): BusinessProfile | null {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1])
            if (parsed.businessName && parsed.ownerName && parsed.email && parsed.phone) {
                return {
                    businessName: parsed.businessName || '',
                    ownerName: parsed.ownerName || '',
                    email: parsed.email || '',
                    phone: parsed.phone || '',
                    whatsappNumber: parsed.whatsappNumber || '',
                    address: parsed.address || '',
                    gstNumber: parsed.gstNumber || '',
                }
            }
        } catch {
        }
    }
    return null
}

function stripJSON(text: string): string {
    return text.replace(/```json\s*[\s\S]*?\s*```/, '').trim()
}

export default function AIChatSetup() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [extractedProfile, setExtractedProfile] = useState<BusinessProfile | null>(null)
    const [isSaved, setIsSaved] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    // Speech recognition state
    const [isListening, setIsListening] = useState(false)
    const [hasSpeechSupport, setHasSpeechSupport] = useState(true)
    const recognitionRef = useRef<any>(null)

    // Configuration state
    const [provider, setProvider] = useState<'gemini' | 'groq'>('groq')
    const [modelId, setModelId] = useState('llama-3.3-70b-versatile')
    const [apiKey, setApiKey] = useState('')

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    useEffect(() => {
        if (!isLoading && hasStarted) {
            inputRef.current?.focus()
        }
    }, [isLoading, hasStarted])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = 'en-US'

                // Keep track of the last final transcript so we don't duplicate when resuming 
                // but SpeechRecognition sends results in batches during continuous
                recognition.onresult = (event: any) => {
                    let finalTranscript = ''
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript
                        }
                    }
                    if (finalTranscript) {
                        setInput((prev) => prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim())
                    }
                }

                recognition.onerror = () => setIsListening(false)
                recognitionRef.current = recognition
            } else {
                setHasSpeechSupport(false)
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
            } catch (e) {
                // If it's already started or fails to start
                setIsListening(false)
            }
        }
    }

    const startChat = async () => {
        setHasStarted(true)
        setIsLoading(true)

        const initialMessage: ChatMessage = {
            role: 'user',
            content: 'Hi, I want to set up my business profile.',
        }

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [initialMessage], provider, modelId, apiKey }),
            })

            const data = await response.json()

            if (data.success) {
                setMessages([
                    { role: 'assistant', content: data.reply },
                ])
            } else {
                const errorMsg = data.isRateLimit
                    ? `⚠️ ${data.message}`
                    : data.message || 'Sorry, I had trouble starting up. Please try again!'
                setMessages([
                    { role: 'assistant', content: errorMsg },
                ])
            }
        } catch {
            setMessages([
                { role: 'assistant', content: 'Connection error. Please check your internet and try again.' },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: ChatMessage = { role: 'user', content: input.trim() }
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setInput('')
        setIsLoading(true)

        const fullHistory: ChatMessage[] = [
            { role: 'user', content: 'Hi, I want to set up my business profile.' },
            ...updatedMessages,
        ]

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: fullHistory, provider, modelId, apiKey }),
            })

            const data = await response.json()

            if (data.success) {
                const aiMessage: ChatMessage = { role: 'assistant', content: data.reply }
                setMessages((prev) => [...prev, aiMessage])

                const profile = extractJSON(data.reply)
                if (profile) {
                    setExtractedProfile(profile)
                }
            } else {
                const errorMsg = data.isRateLimit
                    ? `⚠️ ${data.message}`
                    : data.message || 'Sorry, something went wrong. Please try again!'
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: errorMsg },
                ])
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Connection error. Please try again.' },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!extractedProfile) return

        setIsSaving(true)
        setSaveError(null)

        try {
            const response = await fetch('/api/business', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(extractedProfile),
            })

            const data = await response.json()

            if (data.success) {
                setIsSaved(true)
                if (typeof window !== 'undefined') {
                    localStorage.setItem('businessProfileLastUpdated', Date.now().toString())
                    window.dispatchEvent(
                        new CustomEvent('businessProfileUpdated', {
                            detail: { businessName: extractedProfile.businessName },
                        })
                    )
                }
            } else {
                setSaveError(data.message || 'Failed to save. Please try again.')
            }
        } catch {
            setSaveError('Network error. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleEdit = () => {
        setExtractedProfile(null)
        setInput("I'd like to change something: ")
        inputRef.current?.focus()
    }

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure AI Assistant</h2>
                <p className="text-gray-500 text-center max-w-md mb-8">
                    Choose your AI provider and supply an API key if needed.
                    Groq is recommended for faster generation and generous free tier.
                </p>

                <div className="w-full max-w-md space-y-5 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                        <select
                            value={provider}
                            onChange={(e) => {
                                const newProvider = e.target.value as 'gemini' | 'groq'
                                setProvider(newProvider)
                                // Auto-update to default model for that provider
                                setModelId(newProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash')
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="groq">Groq</option>
                            <option value="gemini">Google Gemini</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
                        <select
                            value={modelId}
                            onChange={(e) => setModelId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {provider === 'groq' && (
                                <>
                                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                                    <option value="gemma2-9b-it">gemma2-9b-it</option>
                                </>
                            )}
                            {provider === 'gemini' && (
                                <>
                                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key (Optional)
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Leaves blank to use system default key"
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            If you have run out of quota, provide your own key here.
                        </p>
                    </div>
                </div>

                <button
                    onClick={startChat}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold
                     hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl
                     transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                    <Sparkles className="w-5 h-5" />
                    Start Chatting
                </button>
            </div>
        )
    }

    if (isSaved) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Profile Saved! 🎉</h2>
                <p className="text-gray-500 text-center max-w-md mb-6">
                    Your business profile has been set up successfully. You can now proceed to the next step.
                </p>
                <div className="flex gap-3">
                    <a
                        href="/admin/setup"
                        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                        ← Back to Setup Wizard
                    </a>
                    <a
                        href="/admin/business"
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        View in Form
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">AI Setup Assistant</h3>
                    <p className="text-purple-100 text-xs text-transform: uppercase">{provider} powered</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-purple-100">Online</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-purple-600 text-white rounded-br-md'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                                }`}
                        >
                            {msg.role === 'assistant' ? stripJSON(msg.content) : msg.content}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User className="w-4 h-4 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-2.5 justify-start">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {extractedProfile && !isSaved && (
                    <div className="mx-2 mt-4">
                        <div className="bg-white border-2 border-purple-200 rounded-xl p-5 shadow-md">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-purple-600" />
                                Business Profile Summary
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {[
                                    { label: 'Business Name', value: extractedProfile.businessName, icon: '🏪' },
                                    { label: 'Owner Name', value: extractedProfile.ownerName, icon: '👤' },
                                    { label: 'Email', value: extractedProfile.email, icon: '📧' },
                                    { label: 'Phone', value: extractedProfile.phone, icon: '📞' },
                                    { label: 'WhatsApp', value: extractedProfile.whatsappNumber, icon: '💬' },
                                    { label: 'Address', value: extractedProfile.address, icon: '📍' },
                                    { label: 'GST Number', value: extractedProfile.gstNumber || 'Not provided', icon: '📋' },
                                ].map((field) => (
                                    <div key={field.label} className="bg-gray-50 rounded-lg p-3">
                                        <span className="text-xs text-gray-500 block mb-0.5">
                                            {field.icon} {field.label}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">{field.value}</span>
                                    </div>
                                ))}
                            </div>

                            {saveError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">
                                    {saveError}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium
                             hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Confirm & Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleEdit}
                                    disabled={isSaving}
                                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium
                             hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 bg-white border-t border-gray-200">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        sendMessage()
                    }}
                    className="flex gap-2"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       disabled:opacity-50 placeholder-gray-400"
                    />
                    {hasSpeechSupport && (
                        <button
                            type="button"
                            onClick={toggleListening}
                            disabled={isLoading}
                            className={`p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${isListening
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            title={isListening ? "Stop listening" : "Start dictation"}
                        >
                            {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    )
}
