'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { checkAuth, logout } from '@/lib/auth'
import { useTrialCheck } from '@/lib/useTrialCheck'
import { useActivityTracker } from '@/lib/useActivityTracker'
import SubscriptionRenewalBanner from '@/components/SubscriptionRenewalBanner'
import AgenticPurchaseOrderDrawer from '@/components/AgenticPurchaseOrderDrawer'
import GeneralAiAgentDrawer from '@/components/GeneralAiAgentDrawer'
import AIChatSetupDrawer from '@/components/AIChatSetupDrawer'
import { AVAILABLE_MODULES } from '@/lib/modules'
import {
  LayoutDashboard,
  Rocket,
  Settings,
  Factory,
  Tags,
  ShoppingCart,
  Package,
  Users,
  User,
  Store,
  Shirt,
  BookOpen,
  Banknote,
  FileText,
  MessageSquare,
  ShieldCheck,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building2,
  Sliders,
  Search,
  Palette,
  Paintbrush,
  MessageCircle,
  Calendar,
  Target
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user' | null>(null)
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({})
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [workflowEnabled, setWorkflowEnabled] = useState<boolean>(false)
  const [websiteBuilderEnabled, setWebsiteBuilderEnabled] = useState<boolean>(false)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0)
  const [tenantModules, setTenantModules] = useState<string[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showAiAgent, setShowAiAgent] = useState(false)
  const [activeAgentOverride, setActiveAgentOverride] = useState<'po' | 'setup' | 'general' | null>(null)

  // Check trial expiry for tenants
  useTrialCheck()

  // Track tenant page views
  useActivityTracker(pathname, tenantId, userRole)

  useEffect(() => {
    const handleToggleAiAgent = (e: any) => {
      if (typeof e.detail === 'boolean') {
        const isOpen = e.detail
        setShowAiAgent(isOpen)
        if (!isOpen) setActiveAgentOverride(null)
      } else if (e.detail && typeof e.detail === 'object') {
        if (e.detail.open !== undefined) {
          setShowAiAgent(e.detail.open)
          if (e.detail.open === false) setActiveAgentOverride(null)
        }
        if (e.detail.type) setActiveAgentOverride(e.detail.type)
      } else {
        setShowAiAgent(prev => {
          const next = !prev
          if (!next) setActiveAgentOverride(null)
          return next
        })
      }
    }

    window.addEventListener('toggleAiAgent', handleToggleAiAgent)
    return () => window.removeEventListener('toggleAiAgent', handleToggleAiAgent)
  }, [])

  useEffect(() => {
    checkAuth().then((auth) => {
      setAuthenticated(auth)
      setLoading(false)
      if (!auth) {
        router.push('/admin/login')
      } else {
        // Fetch current user role after authentication is confirmed
        fetch('/api/auth/check', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            console.log('🔍 Auth check response:', JSON.stringify(data, null, 2))
            if (data.authenticated && data.admin) {
              // Get role from response
              let role = data.admin.role

              // Handle null/undefined
              if (data.admin.type) {
                // Use type if available (tenant, superadmin, user)
                if (data.admin.type === 'tenant') {
                  role = 'admin' // Tenants are admins of their own business
                } else if (data.admin.type === 'superadmin') {
                  role = 'superadmin'
                } else if (data.admin.type === 'user') {
                  role = 'user'
                }
              } else if (!role) {
                console.warn('⚠️ Role is null/undefined in response, checking database...')
                role = 'superadmin' // Temporary: default to superadmin if role missing
              } else {
                role = role.toLowerCase().trim()
                // Normalize role values (handle any case variations)
                if (role === 'super_admin') role = 'superadmin'
              }

              console.log('✅ Setting user role to:', role)
              setUserRole(role as 'superadmin' | 'admin' | 'user')

              // Set user name, email, and permissions
              if (data.admin.name) {
                setUserName(data.admin.name)
              }
              if (data.admin.email) {
                setUserEmail(data.admin.email)
              }
              if (data.admin.permissions) {
                console.log('✅ Setting user permissions:', Object.keys(data.admin.permissions))
                setUserPermissions(data.admin.permissions)
              }

              // Unified fetching logic
              const fetchBusinessInfo = async () => {
                try {
                  // 1. Fetch from business profile (prioritize custom name)
                  const businessRes = await fetch('/api/business', { credentials: 'include' })
                  const businessData = await businessRes.json()

                  if (businessData.success && businessData.data?.businessName) {
                    setBusinessName(businessData.data.businessName)
                  } else if (data.admin.tenant_id) {
                    // 2. Fallback to tenant table name
                    const tenantRes = await fetch(`/api/tenants/${data.admin.tenant_id}`)
                    const tenantData = await tenantRes.json()
                    if (tenantData.success && tenantData.data?.businessName) {
                      setBusinessName(tenantData.data.businessName)
                    }
                  } else {
                    setBusinessName('Lalitha Garments')
                  }
                  
                  // Also fetch pending approvals if admin or tenant
                  if (role === 'admin' || role === 'superadmin') {
                     const approvalsRes = await fetch('/api/approvals', { credentials: 'include' })
                     const approvalsData = await approvalsRes.json()
                     if (approvalsData.success && approvalsData.stats) {
                       setPendingApprovalsCount(approvalsData.stats.pending || 0)
                     }
                  }
                  
                } catch (err) {
                  console.error('Error fetching business info:', err)
                  setBusinessName('Lalitha Garments')
                } finally {
                  // Only stop initializing once we have tried to fetch everything
                  setIsInitializing(false)
                }
              }

              fetchBusinessInfo()

              // Also fetch modules/workflow if tenant_id exists
              if (data.admin.tenant_id) {
                setTenantId(data.admin.tenant_id)
                fetch(`/api/tenants/${data.admin.tenant_id}`)
                  .then(res => res.json())
                  .then(tenantData => {
                    if (tenantData.success && tenantData.data) {
                      setWorkflowEnabled(tenantData.data.workflowEnabled || false)
                      setWebsiteBuilderEnabled(tenantData.data.websiteBuilderEnabled || false)
                      setSlug(tenantData.data.slug || '')
                      setTenantModules(tenantData.data.modules || [])
                    }
                  })
              }
            } else {
              setIsInitializing(false)
            }
          })
          .catch(err => {
            console.error('❌ Error fetching user role:', err)
            setUserRole('superadmin')
            setIsInitializing(false)
          })
      }
    })
  }, [router])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Refresh business name when navigating to/from business setup page
  useEffect(() => {
    if (authenticated) {
      fetch('/api/business')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.businessName) {
            setBusinessName(data.data.businessName)
          }
        })
        .catch(err => {
          console.error('Failed to refresh business profile:', err)
        })
    }
  }, [pathname, authenticated])

  // Listen for business profile updates in real-time
  useEffect(() => {
    let lastCheckedTimestamp = 0

    const handleBusinessProfileUpdate = (event: CustomEvent) => {
      // Update business name immediately if provided in event
      if (event.detail?.businessName) {
        setBusinessName(event.detail.businessName)
        lastCheckedTimestamp = Date.now()
      } else {
        // Otherwise, fetch the latest from API
        fetch('/api/business')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data && data.data.businessName) {
              setBusinessName(data.data.businessName)
              lastCheckedTimestamp = Date.now()
            }
          })
          .catch(err => {
            console.error('Failed to refresh business profile:', err)
          })
      }
    }

    // New: Listen for pending approvals updates
    const handleApprovalsUpdate = () => {
      if (userRole === 'admin' || userRole === 'superadmin') {
        fetch('/api/approvals', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.stats) {
              setPendingApprovalsCount(data.stats.pending || 0)
            }
          })
          .catch(err => console.error('Failed to sync approvals badge:', err))
      }
    }

    // Check localStorage for updates (backup mechanism)
    const checkForUpdates = () => {
      if (typeof window !== 'undefined') {
        const lastUpdated = localStorage.getItem('businessProfileLastUpdated')
        if (lastUpdated) {
          const lastUpdatedTime = parseInt(lastUpdated, 10)
          // Only check if this is a new update (not the one we already processed)
          if (lastUpdatedTime > lastCheckedTimestamp) {
            fetch('/api/business')
              .then(res => res.json())
              .then(data => {
                if (data.success && data.data && data.data.businessName) {
                  setBusinessName(data.data.businessName)
                  lastCheckedTimestamp = Date.now()
                }
              })
              .catch(err => {
                console.error('Failed to refresh business profile:', err)
              })
          }
        }
      }
    }

    // Add event listener for immediate updates
    window.addEventListener('businessProfileUpdated', handleBusinessProfileUpdate as EventListener)
    window.addEventListener('pendingApprovalsUpdated', handleApprovalsUpdate as EventListener)

    // Check for updates on window focus (in case user switches tabs or windows)
    window.addEventListener('focus', checkForUpdates)

    // Periodic check every 3 seconds (as backup, only if there's a recent update)
    const intervalId = setInterval(() => {
      if (typeof window !== 'undefined') {
        const lastUpdated = localStorage.getItem('businessProfileLastUpdated')
        if (lastUpdated) {
          const lastUpdatedTime = parseInt(lastUpdated, 10)
          const now = Date.now()
          // Only check if updated within last 10 seconds
          if (now - lastUpdatedTime < 10000 && lastUpdatedTime > lastCheckedTimestamp) {
            checkForUpdates()
          }
        }
      }
    }, 3000)

    // Cleanup
    return () => {
      window.removeEventListener('businessProfileUpdated', handleBusinessProfileUpdate as EventListener)
      window.removeEventListener('pendingApprovalsUpdated', handleApprovalsUpdate as EventListener)
      window.removeEventListener('focus', checkForUpdates)
      clearInterval(intervalId)
    }
  }, [userRole])

  // Persist sidebar collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--accent)' }}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  // Helper function to check permission
  const hasPermission = (resource: string, action: string = 'read') => {
    // Superadmin wildcard check
    if (userPermissions['*'] && userPermissions['*'].includes('manage')) return true

    // Resource check
    const actions = userPermissions[resource] || []
    if (actions.includes('manage')) return true

    // Action hierarchy check
    const hierarchy: Record<string, number> = { read: 1, write: 2, delete: 3, manage: 4 }
    return (hierarchy[actions.find(a => hierarchy[a] >= hierarchy[action]) || ''] || 0) > 0
  }

  // Updated navItems with Lucide icons
  // Now includes required permissions and subscription modules
  const navItems: {
    href: string;
    label: string;
    icon: any;
    resource?: string;
    action?: string;
    module?: string;
    badge?: number;
    subItems?: { href: string; label: string }[];
  }[] = [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, resource: 'dashboard' },
      { href: '/admin/leads', label: 'Trial Leads', icon: Target, resource: 'tenants', action: 'manage' }, // Superadmin only
      { href: '/admin/approvals', label: 'Approvals', icon: ShieldCheck, resource: 'purchases', module: 'purchases', badge: pendingApprovalsCount },
      { href: '/admin/tenants', label: 'Tenants', icon: Building2, resource: 'tenants', action: 'manage' }, // Usually superadmin only
      { href: '/admin/research', label: 'Raw Research', icon: Search, resource: 'research', action: 'read', module: 'research' },
      { href: '/admin/setup', label: 'Setup Wizard', icon: Rocket, resource: 'dashboard', module: 'setup' },
      { href: '/admin/business', label: 'Business Setup', icon: Settings, resource: 'business', module: 'business' },
      { href: '/admin/billing', label: 'Billing & Pricing', icon: Banknote, resource: 'business', module: 'business' },
      {
        href: '/admin/workflow',
        label: 'Workflow',
        icon: Sliders,
        resource: 'workflow',
        module: 'workflow',
        subItems: [
          { href: '/admin/workflow/visualize', label: 'Overview' },
          { href: '/admin/workflow/rules', label: 'Configuration' }
        ]
      },
      { href: '/admin/suppliers', label: 'Suppliers', icon: Factory, resource: 'suppliers', module: 'suppliers' },
      { href: '/admin/categories', label: 'Categories', icon: Tags, resource: 'categories', module: 'inventory' },
      { href: '/admin/purchases', label: 'Purchase Orders', icon: ShoppingCart, resource: 'purchases', module: 'purchases' },
      { href: '/admin/inventory', label: 'Inventory', icon: Package, resource: 'inventory', module: 'inventory' },
      { href: '/admin/customers', label: 'Customers', icon: Users, resource: 'customers', module: 'customers' },
      { href: '/admin/products', label: 'Products', icon: Shirt, resource: 'products', module: 'products' },
      { href: '/admin/catalogues', label: 'Catalogues', icon: BookOpen, resource: 'catalogues', module: 'catalogues' },
      { href: '/admin/sales', label: 'Sales', icon: Banknote, resource: 'sales', module: 'sales' },
      { href: '/admin/invoices', label: 'Invoices', icon: FileText, resource: 'invoices', module: 'invoices' },
      { href: '/admin/enquiries', label: 'Customer Enquiries', icon: MessageSquare, resource: 'enquiries', module: 'enquiries' },
      { href: '/admin/whatsapp-community', label: 'WhatsApp Community', icon: MessageCircle, resource: 'customers', module: 'whatsapp_community' },
      { href: '/admin/admins', label: 'Admin Management', icon: ShieldCheck, resource: 'admins', module: 'admins' },
      { href: '/admin/users', label: 'User Management', icon: UserCog, resource: 'users', module: 'users' },
      { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, resource: 'roles', module: 'roles' },
      { href: '/admin/theme', label: 'Platform Theme', icon: Palette, resource: 'theme', action: 'manage' },
      { href: '/admin/appearance', label: 'Appearance', icon: Paintbrush, resource: 'appearance' },
    ]

  // Filter nav items based on user role and permissions
  const filteredNavItems = (() => {
    if (!userRole) {
      // While loading, show minimal items
      return []
    }

    // Superadmin bypass (legacy check fallback)
    let items = navItems

    // Filter based on permissions for non-superadmins
    if (userRole !== 'superadmin') {
      items = items.filter(item => {
        if (item.resource) {
          return hasPermission(item.resource, item.action || 'read')
        }
        return true
      })
    }

    // Special handling for legacy 'user' role if permissions are empty
    // This provides backward compatibility if permissions migration failed or delayed
    if (Object.keys(userPermissions).length === 0 && userRole === 'user') {
      return navItems.filter(item => ['/admin/products', '/admin/catalogues'].includes(item.href))
    }

    // For tenants, conditionally show items based on enabled modules and subscription
    if (userRole === 'admin') {
      items = items.filter(item => {
        // Explicitly hide Tenants list and Platform Theme from non-superadmins
        if (item.href === '/admin/tenants' || item.href === '/admin/theme') {
          return false
        }

        // If the item belongs to a specific module, check if that module is enabled for this tenant
        if (item.module && !tenantModules.includes(item.module)) {
          return false
        }

        // Use workflowEnabled flag as fallback for workflow specifically (legacy support)
        if (item.module === 'workflow' && !workflowEnabled && !tenantModules.includes('workflow')) {
          return false
        }

        return true
      })
    }

    // Hide Billing from non-tenants (Superadmins and other roles)
    if (userRole !== 'admin') {
      items = items.filter(item => item.href !== '/admin/billing')
    }

    return items
  })()

  return (
    <div className="min-h-screen bg-[#F8FAFD] font-sans selection:bg-[var(--accent)]/10 selection:text-[var(--accent)]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 text-white shadow-[0_0_50px_rgba(0,0,0,0.1)] transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${sidebarCollapsed ? 'lg:w-[88px]' : 'lg:w-[280px]'} w-[280px] flex flex-col border-r border-white/5`}
        style={{ 
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[rgba(var(--accent-rgb),0.2)] rounded-full blur-[80px] pointer-events-none"></div>
          
          {/* Header Section */}
          <div className={`flex-shrink-0 relative z-10 ${sidebarCollapsed ? 'p-5 flex flex-col items-center justify-center' : 'p-6'}`}>
            {!sidebarCollapsed ? (
              <div className="space-y-6">
                <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500">
                    <span className="text-2xl drop-shadow-sm">🌸</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Portal</span>
                       <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                    </div>
                    <h1 className="text-lg font-black text-white truncate leading-tight tracking-tight mt-0.5">
                      {businessName || 'Command Center'}
                    </h1>
                  </div>
                </Link>
                
                <div className="flex items-center gap-2 py-2 px-3 bg-white/5 border border-white/5 rounded-2xl">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-80" style={{ color: 'var(--sidebar-text)' }}>
                     {userRole === 'superadmin' ? 'Super Intelligence' : 'Enterprise Admin'}
                   </span>
                </div>
              </div>
            ) : (
              <Link href="/admin/dashboard" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl group hover:scale-110 transition-all duration-500 relative">
                 <span className="text-xl">🌸</span>
                 <div className="absolute -right-1 -top-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0F172A]"></div>
              </Link>
            )}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>

          {/* Navigation Section */}
          <nav className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-none custom-sidebar-nav ${sidebarCollapsed ? 'px-3' : 'px-4'} space-y-1`}>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || (item.subItems && item.subItems.some(sub => pathname === sub.href))
              const Icon = item.icon
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isExpanded = isActive || (hasSubItems && pathname.startsWith(item.href))

              return (
                <div key={item.href} className="group/nav-item">
                  <Link
                    href={item.href}
                    className={`relative flex items-center transition-all duration-300 rounded-[1.2rem] ${
                      sidebarCollapsed ? 'justify-center p-3.5' : 'px-4 py-3 gap-3.5'
                    } ${isActive ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}`}
                    style={{ color: isActive ? 'var(--sidebar-text)' : 'rgba(255,255,255,0.5)' }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 bg-white/10 rounded-[1.2rem] border border-white/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <div 
                      className={`relative z-10 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover/nav-item:scale-110'}`}
                      style={{ color: isActive ? 'var(--accent)' : 'inherit' }}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>

                    {!sidebarCollapsed && (
                      <span 
                        className={`relative z-10 text-[13px] font-bold tracking-tight flex-1`}
                        style={{ color: isActive ? 'var(--sidebar-text)' : 'inherit' }}
                      >
                        {item.label}
                      </span>
                    )}

                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="relative z-10 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        {item.badge}
                      </span>
                    )}

                    {!sidebarCollapsed && hasSubItems && (
                      <ChevronRight size={14} className={`relative z-10 transition-transform duration-300 opacity-40 ${isExpanded ? 'rotate-90' : ''}`} />
                    )}
                    
                    {/* Collapsed Tooltip */}
                    {sidebarCollapsed && (
                       <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-black text-white opacity-0 group-hover/nav-item:opacity-100 pointer-events-none transition-all duration-300 translate-x-2 group-hover/nav-item:translate-x-0 z-[100] whitespace-nowrap shadow-2xl">
                          {item.label}
                       </div>
                    )}
                  </Link>

                  {/* Submenu with animation */}
                  {!sidebarCollapsed && hasSubItems && isExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-white/5 space-y-1">
                      {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.href
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`block py-2 text-[12px] font-bold transition-all hover:text-white`}
                            style={{ color: isSubActive ? 'var(--accent)' : 'rgba(255,255,255,0.4)' }}
                          >
                            {sub.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer Section */}
          <div className={`flex-shrink-0 ${sidebarCollapsed ? 'p-3' : 'p-6'} space-y-4 relative z-10`}>
             <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>
             
             {/* Profile Card */}
             {!sidebarCollapsed ? (
               <div className="bg-white/5 border border-white/5 rounded-3xl p-4 group hover:bg-white/10 transition-all duration-500 cursor-pointer overflow-hidden relative">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-lg"
                      style={{ background: 'var(--accent)' }}
                    >
                      {userName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">Command By</p>
                      <p className="text-[13px] font-black text-white truncate mt-1">{userName || 'Administrator'}</p>
                    </div>
                  </div>
                  {/* Subtle hover effect light */}
                  <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>
               </div>
             ) : (
               <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                     <User size={20} />
                  </div>
               </div>
             )}

             <div className="flex flex-col gap-2">
                <button
                  onClick={toggleSidebar}
                  className={`hidden lg:flex items-center text-slate-500 hover:text-white transition-all text-[12px] font-black uppercase tracking-widest py-2 ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-2'}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                     {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                  </div>
                  {!sidebarCollapsed && <span>Layout Modes</span>}
                </button>

                <button
                  onClick={handleLogout}
                  className={`flex items-center text-red-400/70 hover:text-red-400 transition-all text-[12px] font-black uppercase tracking-widest py-2 rounded-2xl hover:bg-red-400/5 ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-2 border border-transparent hover:border-red-400/10'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${sidebarCollapsed ? 'bg-red-400/10' : 'bg-transparent group-hover:bg-red-400/10'}`}>
                     <LogOut size={16} />
                  </div>
                  {!sidebarCollapsed && <span>Terminate Session</span>}
                </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[280px]'}`}>
        {/* Top Floating Bar (Search & Mobile Menu) */}
        <header className="sticky top-0 z-30 px-4 py-4 lg:px-8 pointer-events-none">
           <div className="max-w-[1600px] mx-auto flex items-center justify-between pointer-events-auto">
              <div className="lg:hidden flex items-center gap-3 bg-white border border-slate-100 shadow-xl rounded-2xl px-3 py-2">
                 <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors"
                 >
                    <Menu size={22} className="text-slate-900" />
                 </button>
                 <span className="w-px h-6 bg-slate-100"></span>
                 <span className="text-xl">🌸</span>
              </div>
              
              <div className="hidden lg:flex flex-1 items-center max-w-md">
                 {/* Desktop Search Placeholder or Breadcrumbs */}
                 <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <span>Admin</span>
                    <ChevronRight size={12} />
                    <span className="text-slate-900">{pathname.split('/').pop()?.replace(/-/g, ' ')}</span>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="hidden md:flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm">
                    <Calendar size={14} className="text-indigo-500" style={{ color: 'var(--accent)' }} />
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                       {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                 </div>
                 {/* Context-Aware AI Agent Button */}
                 {(userRole === 'superadmin' || userRole === 'admin') && (
                   <button
                     onClick={() => setShowAiAgent(true)}
                     title={
                       pathname.includes('/admin/purchases') 
                        ? "AI Purchase Order Agent" 
                        : (pathname.includes('/admin/setup') || pathname.includes('/admin/business'))
                        ? "AI Setup Assistant"
                        : "AI General Assistant"
                     }
                     className={`w-10 h-10 rounded-2xl bg-white border shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-all group ${
                       pathname.includes('/admin/purchases') 
                        ? 'border-indigo-100 hover:border-indigo-300' 
                        : (pathname.includes('/admin/setup') || pathname.includes('/admin/business'))
                        ? 'border-purple-100 hover:border-purple-300'
                        : 'border-slate-100 hover:border-slate-300'
                     }`}
                   >
                     <div className="relative">
                       <MessageCircle 
                        size={18} 
                        className={`transition-colors ${
                          pathname.includes('/admin/purchases') 
                            ? 'text-indigo-600 group-hover:text-indigo-700' 
                            : 'text-slate-600 group-hover:text-slate-900'
                        }`} 
                       />
                       {/* Pulsant dot only for active agents */}
                       {(pathname.includes('/admin/purchases') && tenantModules.includes('ai-purchase-order')) || 
                        (pathname.includes('/admin/setup') || pathname.includes('/admin/business')) ? (
                         <div className={`absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse ${
                            pathname.includes('/admin/purchases') ? 'bg-indigo-500' : 'bg-purple-500'
                         }`} />
                       ) : (
                         <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full border border-white bg-slate-300" />
                       )}
                     </div>
                   </button>
                 )}
              </div>
           </div>
        </header>

        <div className="px-4 lg:px-8 mb-4 max-w-[1600px] mx-auto">
           {userRole === 'admin' && <SubscriptionRenewalBanner />}
        </div>

        <main className="p-4 lg:p-8 pt-0 max-w-[1600px] mx-auto min-h-[calc(100vh-100px)]">
          {children}
        </main>

      {/* Global Context-Aware AI Agent Drawers */}
      {(activeAgentOverride === 'po' || (!activeAgentOverride && pathname.includes('/admin/purchases'))) ? (
        <AgenticPurchaseOrderDrawer
          isOpen={showAiAgent}
          onClose={() => { setShowAiAgent(false); setActiveAgentOverride(null); }}
          onSuccess={() => { setShowAiAgent(false); setActiveAgentOverride(null); }}
        />
      ) : (activeAgentOverride === 'setup' || (!activeAgentOverride && (pathname.includes('/admin/setup') || pathname.includes('/admin/business')))) ? (
        <AIChatSetupDrawer
          isOpen={showAiAgent}
          onClose={() => { setShowAiAgent(false); setActiveAgentOverride(null); }}
        />
      ) : (
        <GeneralAiAgentDrawer
          isOpen={showAiAgent}
          onClose={() => { setShowAiAgent(false); setActiveAgentOverride(null); }}
        />
      )}
      </div>
    </div>
  )
}


function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
