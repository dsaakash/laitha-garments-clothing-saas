'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface ThemeSettings {
    sidebarColor: string
    sidebarHoverColor: string
    accentColor: string
    accentHoverColor: string
    sidebarTextColor: string
    topbarStyle: 'light' | 'dark'
    buttonRadius: string
}

const DEFAULT_THEME: ThemeSettings = {
    sidebarColor: '#1e293b',
    sidebarHoverColor: '#334155',
    accentColor: '#9333ea',
    accentHoverColor: '#7e22ce',
    sidebarTextColor: '#e2e8f0',
    topbarStyle: 'light',
    buttonRadius: 'rounded-xl',
}

interface ThemeContextType {
    theme: ThemeSettings
    updateTheme: (newTheme: Partial<ThemeSettings>) => void
    resetTheme: () => void
    loading: boolean
}

const ThemeContext = createContext<ThemeContextType>({
    theme: DEFAULT_THEME,
    updateTheme: () => { },
    resetTheme: () => { },
    loading: true,
})

export function useTheme() {
    return useContext(ThemeContext)
}

// Helper: derive lighter / darker shades for hover / active states
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 0, g: 0, b: 0 }
}

function applyThemeToDOM(theme: ThemeSettings) {
    const root = document.documentElement
    root.style.setProperty('--sidebar-bg', theme.sidebarColor)
    root.style.setProperty('--sidebar-hover', theme.sidebarHoverColor)
    root.style.setProperty('--accent', theme.accentColor)
    root.style.setProperty('--accent-hover', theme.accentHoverColor)
    root.style.setProperty('--sidebar-text', theme.sidebarTextColor)
    root.style.setProperty('--btn-radius', theme.buttonRadius === 'rounded-xl' ? '0.75rem' : theme.buttonRadius === 'rounded-lg' ? '0.5rem' : theme.buttonRadius === 'rounded-full' ? '9999px' : '0.375rem')

    // Generate accent RGB for opacity-based usages
    const accentRgb = hexToRgb(theme.accentColor)
    root.style.setProperty('--accent-r', accentRgb.r.toString())
    root.style.setProperty('--accent-g', accentRgb.g.toString())
    root.style.setProperty('--accent-b', accentRgb.b.toString())
    root.style.setProperty('--accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`)

    // Generate sidebar RGB for opacity-based usages
    const sidebarRgb = hexToRgb(theme.sidebarColor)
    root.style.setProperty('--sidebar-r', sidebarRgb.r.toString())
    root.style.setProperty('--sidebar-g', sidebarRgb.g.toString())
    root.style.setProperty('--sidebar-b', sidebarRgb.b.toString())
    root.style.setProperty('--sidebar-rgb', `${sidebarRgb.r}, ${sidebarRgb.g}, ${sidebarRgb.b}`)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME)
    const [loading, setLoading] = useState(true)

    // Fetch theme on mount
    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const res = await fetch('/api/theme', { credentials: 'include' })
                const data = await res.json()
                if (data.success && data.data) {
                    const merged = { ...DEFAULT_THEME, ...data.data }
                    setTheme(merged)
                    applyThemeToDOM(merged)
                }
            } catch (err) {
                console.error('Failed to fetch theme:', err)
                applyThemeToDOM(DEFAULT_THEME)
            } finally {
                setLoading(false)
            }
        }
        fetchTheme()
    }, [])

    const updateTheme = useCallback((newTheme: Partial<ThemeSettings>) => {
        setTheme((prev) => {
            const merged = { ...prev, ...newTheme }
            applyThemeToDOM(merged)
            return merged
        })
    }, [])

    const resetTheme = useCallback(() => {
        setTheme(DEFAULT_THEME)
        applyThemeToDOM(DEFAULT_THEME)
    }, [])

    // Listen for theme update events from settings pages
    useEffect(() => {
        const handleThemeUpdate = (e: CustomEvent) => {
            if (e.detail) {
                const merged = { ...DEFAULT_THEME, ...e.detail }
                setTheme(merged)
                applyThemeToDOM(merged)
            }
        }
        window.addEventListener('themeUpdated', handleThemeUpdate as EventListener)
        return () => {
            window.removeEventListener('themeUpdated', handleThemeUpdate as EventListener)
        }
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, loading }}>
            {children}
        </ThemeContext.Provider>
    )
}
