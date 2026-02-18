'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useTheme, ThemeSettings } from '@/components/ThemeProvider'
import {
    Palette,
    Check,
    RotateCcw,
    Save,
    Sun,
    Moon,
    LayoutDashboard,
    Package,
    Users,
    Settings,
    Sparkles,
} from 'lucide-react'

// Preset themes with friendly names
const PRESET_THEMES: { name: string; emoji: string; description: string; settings: Partial<ThemeSettings> }[] = [
    {
        name: 'Default Purple',
        emoji: '💜',
        description: 'Classic dark sidebar with purple accents',
        settings: {
            sidebarColor: '#1e293b',
            sidebarHoverColor: '#334155',
            accentColor: '#9333ea',
            accentHoverColor: '#7e22ce',
            sidebarTextColor: '#e2e8f0',
        },
    },
    {
        name: 'Ocean Blue',
        emoji: '🌊',
        description: 'Cool blue tones for a calm workspace',
        settings: {
            sidebarColor: '#0f172a',
            sidebarHoverColor: '#1e3a5f',
            accentColor: '#3b82f6',
            accentHoverColor: '#2563eb',
            sidebarTextColor: '#e0f2fe',
        },
    },
    {
        name: 'Forest Green',
        emoji: '🌿',
        description: 'Nature-inspired green for a fresh look',
        settings: {
            sidebarColor: '#14261c',
            sidebarHoverColor: '#1a3a28',
            accentColor: '#22c55e',
            accentHoverColor: '#16a34a',
            sidebarTextColor: '#dcfce7',
        },
    },
    {
        name: 'Sunset Orange',
        emoji: '🌅',
        description: 'Warm orange tones for an energetic feel',
        settings: {
            sidebarColor: '#1c1008',
            sidebarHoverColor: '#3d2410',
            accentColor: '#f97316',
            accentHoverColor: '#ea580c',
            sidebarTextColor: '#fff7ed',
        },
    },
    {
        name: 'Crimson Red',
        emoji: '🔴',
        description: 'Bold red accents for a powerful look',
        settings: {
            sidebarColor: '#1a0a0a',
            sidebarHoverColor: '#3b1515',
            accentColor: '#ef4444',
            accentHoverColor: '#dc2626',
            sidebarTextColor: '#fee2e2',
        },
    },
    {
        name: 'Rose Gold',
        emoji: '🌹',
        description: 'Elegant rose gold for a premium feel',
        settings: {
            sidebarColor: '#1f1318',
            sidebarHoverColor: '#3d2530',
            accentColor: '#f472b6',
            accentHoverColor: '#ec4899',
            sidebarTextColor: '#fce7f3',
        },
    },
    {
        name: 'Dark Slate',
        emoji: '🖤',
        description: 'Minimal dark theme with grey accents',
        settings: {
            sidebarColor: '#111111',
            sidebarHoverColor: '#222222',
            accentColor: '#6b7280',
            accentHoverColor: '#4b5563',
            sidebarTextColor: '#d1d5db',
        },
    },
    {
        name: 'Royal Indigo',
        emoji: '👑',
        description: 'Deep indigo for a regal appearance',
        settings: {
            sidebarColor: '#1e1040',
            sidebarHoverColor: '#2d1a5e',
            accentColor: '#6366f1',
            accentHoverColor: '#4f46e5',
            sidebarTextColor: '#e0e7ff',
        },
    },
]

// Mini sidebar preview component
function SidebarPreview({ theme }: { theme: Partial<ThemeSettings> }) {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', active: true },
        { icon: Package, label: 'Inventory', active: false },
        { icon: Users, label: 'Customers', active: false },
        { icon: Settings, label: 'Settings', active: false },
    ]

    return (
        <div
            className="w-full rounded-xl overflow-hidden shadow-lg border border-gray-200"
            style={{ height: '280px' }}
        >
            <div className="flex h-full">
                {/* Mini Sidebar */}
                <div
                    className="w-48 flex flex-col"
                    style={{ backgroundColor: theme.sidebarColor || '#1e293b' }}
                >
                    {/* Logo area */}
                    <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                style={{ backgroundColor: theme.accentColor || '#9333ea' }}
                            >
                                B
                            </div>
                            <div>
                                <div className="text-xs font-bold" style={{ color: theme.sidebarTextColor || '#e2e8f0' }}>
                                    Business Name
                                </div>
                                <div className="text-[10px]" style={{ color: `${theme.sidebarTextColor || '#e2e8f0'}80` }}>
                                    Admin Portal
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu items */}
                    <div className="flex-1 px-2 py-3 space-y-1">
                        {menuItems.map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                                style={{
                                    backgroundColor: item.active ? theme.accentColor || '#9333ea' : 'transparent',
                                    color: item.active ? '#ffffff' : theme.sidebarTextColor || '#e2e8f0',
                                }}
                            >
                                <item.icon className="w-3.5 h-3.5" />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini Content Area */}
                <div className="flex-1 bg-gray-50 p-4">
                    <div className="h-4 w-32 bg-gray-300 rounded mb-3"></div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="h-14 bg-white rounded-lg border border-gray-100 p-2">
                            <div className="h-2 w-12 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-8 rounded" style={{ backgroundColor: theme.accentColor || '#9333ea', opacity: 0.3 }}></div>
                        </div>
                        <div className="h-14 bg-white rounded-lg border border-gray-100 p-2">
                            <div className="h-2 w-10 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-8 rounded" style={{ backgroundColor: theme.accentColor || '#9333ea', opacity: 0.3 }}></div>
                        </div>
                    </div>
                    <div
                        className="h-6 w-20 rounded-lg flex items-center justify-center text-[10px] text-white font-medium"
                        style={{ backgroundColor: theme.accentColor || '#9333ea' }}
                    >
                        Button
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ThemePage() {
    const { theme, updateTheme } = useTheme()
    const [localTheme, setLocalTheme] = useState<Partial<ThemeSettings>>({})
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

    // Initialize local theme from context
    useEffect(() => {
        setLocalTheme(theme)
        // Determine which preset matches
        const match = PRESET_THEMES.find(
            (p) =>
                p.settings.sidebarColor === theme.sidebarColor &&
                p.settings.accentColor === theme.accentColor
        )
        if (match) setSelectedPreset(match.name)
    }, [theme])

    const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
        setLocalTheme((prev) => ({ ...prev, ...preset.settings }))
        setSelectedPreset(preset.name)
        // Apply live preview
        updateTheme(preset.settings)
    }

    const handleColorChange = (key: keyof ThemeSettings, value: string) => {
        setLocalTheme((prev) => ({ ...prev, [key]: value }))
        setSelectedPreset(null)
        // Apply live preview
        updateTheme({ [key]: value })
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const res = await fetch('/api/theme', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(localTheme),
            })
            const data = await res.json()
            if (data.success) {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
                // Dispatch event so ThemeProvider picks it up
                window.dispatchEvent(new CustomEvent('themeUpdated', { detail: data.data }))
            } else {
                setError(data.message || 'Failed to save theme')
            }
        } catch (err) {
            console.error('Save error:', err)
            setError('Failed to save theme. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        const defaultPreset = PRESET_THEMES[0]
        setLocalTheme(defaultPreset.settings)
        setSelectedPreset(defaultPreset.name)
        updateTheme(defaultPreset.settings as ThemeSettings)
    }

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                                <Palette className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">Platform Theme</h1>
                        </div>
                        <p className="text-gray-500 ml-14">
                            Set the default theme for all tenants. Each tenant can override this with their own colors.
                        </p>
                    </div>
                </div>

                {/* Success / Error Messages */}
                {saved && (
                    <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl animate-fade-in">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Platform theme saved successfully!</span> All tenants without custom themes will see this.
                    </div>
                )}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Presets + Custom Colors */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Preset Themes */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Quick Themes</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-5">Click any theme below to instantly preview it</p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {PRESET_THEMES.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => applyPreset(preset)}
                                        className={`relative group p-3 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02] ${selectedPreset === preset.name
                                                ? 'border-blue-500 shadow-md shadow-blue-100 bg-blue-50'
                                                : 'border-gray-100 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        {selectedPreset === preset.name && (
                                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}

                                        {/* Color preview circles */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: preset.settings.sidebarColor }}
                                            ></div>
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: preset.settings.accentColor }}
                                            ></div>
                                        </div>

                                        <div className="text-sm font-medium text-gray-800">
                                            <span className="mr-1">{preset.emoji}</span>
                                            {preset.name}
                                        </div>
                                        <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{preset.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Colors */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Colors</h2>
                            <p className="text-sm text-gray-500 mb-5">Fine-tune individual colors to match your brand</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Sidebar Background */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Moon className="w-4 h-4 text-gray-400" /> Sidebar Background
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={localTheme.sidebarColor || '#1e293b'}
                                            onChange={(e) => handleColorChange('sidebarColor', e.target.value)}
                                            className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.sidebarColor || '#1e293b'}
                                            onChange={(e) => handleColorChange('sidebarColor', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Accent Color */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Sun className="w-4 h-4 text-gray-400" /> Accent Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={localTheme.accentColor || '#9333ea'}
                                            onChange={(e) => handleColorChange('accentColor', e.target.value)}
                                            className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.accentColor || '#9333ea'}
                                            onChange={(e) => handleColorChange('accentColor', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Sidebar Hover */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        Sidebar Hover
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={localTheme.sidebarHoverColor || '#334155'}
                                            onChange={(e) => handleColorChange('sidebarHoverColor', e.target.value)}
                                            className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.sidebarHoverColor || '#334155'}
                                            onChange={(e) => handleColorChange('sidebarHoverColor', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Text Color */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        Sidebar Text Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={localTheme.sidebarTextColor || '#e2e8f0'}
                                            onChange={(e) => handleColorChange('sidebarTextColor', e.target.value)}
                                            className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.sidebarTextColor || '#e2e8f0'}
                                            onChange={(e) => handleColorChange('sidebarTextColor', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Accent Hover */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        Accent Hover
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={localTheme.accentHoverColor || '#7e22ce'}
                                            onChange={(e) => handleColorChange('accentHoverColor', e.target.value)}
                                            className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.accentHoverColor || '#7e22ce'}
                                            onChange={(e) => handleColorChange('accentHoverColor', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Preview + Actions */}
                    <div className="space-y-6">
                        {/* Live Preview */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Live Preview</h2>
                            <p className="text-sm text-gray-500 mb-4">This is how your admin panel will look</p>
                            <SidebarPreview theme={localTheme} />
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Platform Theme
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleReset}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset to Default
                            </button>
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <Palette className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-blue-900 text-sm">How it works</h3>
                                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                        This theme is the <strong>platform default</strong>. All new tenants will use this theme automatically.
                                        Each tenant can customize their own colors from their &quot;Appearance&quot; settings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
