'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { checkAuth, logout } from '@/lib/auth'
import { useTrialCheck } from '@/lib/useTrialCheck'
import SubscriptionRenewalBanner from '@/components/SubscriptionRenewalBanner'
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
  MessageCircle
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
  const [workflowEnabled, setWorkflowEnabled] = useState<boolean>(false)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0)
  const [tenantModules, setTenantModules] = useState<string[]>([])
  const [isInitializing, setIsInitializing] = useState(true)

  // Check trial expiry for tenants
  useTrialCheck()

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
                fetch(`/api/tenants/${data.admin.tenant_id}`)
                  .then(res => res.json())
                  .then(tenantData => {
                    if (tenantData.success && tenantData.data) {
                      setWorkflowEnabled(tenantData.data.workflowEnabled || false)
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
      window.removeEventListener('focus', checkForUpdates)
      clearInterval(intervalId)
    }
  }, [])

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
      { href: '/admin/approvals', label: 'Approvals', icon: ShieldCheck, resource: 'purchases', module: 'purchases', badge: pendingApprovalsCount },
      { href: '/admin/tenants', label: 'Tenants', icon: Building2, resource: 'tenants', action: 'manage' }, // Usually superadmin only
      { href: '/admin/research', label: 'Raw Research', icon: Search, resource: 'research', action: 'read', module: 'research' },
      { href: '/admin/setup', label: 'Setup Wizard', icon: Rocket, resource: 'dashboard', module: 'setup' },
      { href: '/admin/business', label: 'Business Setup', icon: Settings, resource: 'business', module: 'business' },
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
    if (userRole === 'superadmin') return navItems

    // Filter based on permissions
    let items = navItems.filter(item => {
      // If resource is specified, check permission
      if (item.resource) {
        return hasPermission(item.resource, item.action || 'read')
      }
      return true // No resource specific requirement? (Should be rare)
    })

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

    return items
  })()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 text-white shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72 flex flex-col`}
        style={{ backgroundColor: 'var(--sidebar-bg, #1e293b)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex-shrink-0 backdrop-blur border-b ${sidebarCollapsed ? 'p-4 items-center justify-center' : 'p-6'}`} style={{ backgroundColor: 'rgba(0,0,0,0.15)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between gap-3">
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  {isInitializing && !businessName ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-10 bg-white/10 rounded-xl w-3/4"></div>
                      <div className="h-4 bg-white/5 rounded-lg w-1/2"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                          <Store className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-purple-200/50 font-black mb-0.5">Your Store</p>
                          <h1 className="text-xl font-extrabold text-white truncate leading-none tracking-tight drop-shadow-sm">
                            {businessName || 'Loading...'}
                          </h1>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex items-center gap-2 text-[9px] font-black py-1.5 px-3 rounded-full shadow-lg border border-white/10" style={{ color: '#ffffff', backgroundColor: 'var(--accent, #9333ea)' }}>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                          <span className="uppercase tracking-[0.15em]">{userRole === 'user' ? 'Member' : 'Admin Portal'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {sidebarCollapsed && (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl relative group overflow-hidden" style={{ backgroundColor: 'var(--accent, #9333ea)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                  <span className="font-black text-xl text-white relative z-10">
                    {businessName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mobile Close Button */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden hover:text-white p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--sidebar-text, #94a3b8)' }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto scrollbar-thin ${sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-6'} space-y-1.5`}>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || (item.subItems && item.subItems.some(sub => pathname === sub.href))
              const Icon = item.icon
              const hasSubItems = item.subItems && item.subItems.length > 0
              // State to track if submenu is expanded - defaulting to true if active
              const isExpanded = isActive || (hasSubItems && pathname.startsWith(item.href))

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center rounded-xl transition-all duration-200 group ${sidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3'
                      } ${isActive && !hasSubItems
                        ? 'text-white shadow-lg'
                        : isActive && hasSubItems
                          ? 'text-white'
                          : ''
                      }`}
                    style={{
                      backgroundColor: isActive && !hasSubItems
                        ? 'var(--accent, #9333ea)'
                        : isActive && hasSubItems
                          ? 'var(--sidebar-hover, #334155)'
                          : undefined,
                      color: isActive
                        ? '#ffffff'
                        : 'var(--sidebar-text, #94a3b8)',
                    }}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={2} />

                    {!sidebarCollapsed && (
                      <span className="font-medium text-sm flex-1">{item.label}</span>
                    )}

                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    {!sidebarCollapsed && hasSubItems && (
                      <div style={{ color: 'var(--sidebar-text, #64748b)', opacity: 0.6 }}>
                        {isExpanded ? <ChevronLeft className="w-4 h-4 -rotate-90" /> : <ChevronLeft className="w-4 h-4" />}
                      </div>
                    )}

                    {!sidebarCollapsed && isActive && !hasSubItems && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full shadow-glow"></span>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 text-white text-xs font-medium rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap" style={{ backgroundColor: 'var(--sidebar-bg, #1e293b)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        {item.label}
                        {hasSubItems && item.subItems?.map(sub => (
                          <div key={sub.href} className="mt-1 font-normal pl-2" style={{ color: 'var(--sidebar-text, #94a3b8)', opacity: 0.7, borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                            {sub.label}
                          </div>
                        ))}
                        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--sidebar-bg, #1e293b)', borderLeft: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}></div>
                      </div>
                    )}
                  </Link>

                  {/* Submenu Items */}
                  {!sidebarCollapsed && hasSubItems && (
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                      {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.href
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="flex items-center pl-12 pr-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                            style={{
                              color: isSubActive ? 'var(--accent, #9333ea)' : 'var(--sidebar-text, #94a3b8)',
                              backgroundColor: isSubActive ? 'rgba(255,255,255,0.05)' : undefined,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full mr-3" style={{ backgroundColor: isSubActive ? 'var(--accent, #9333ea)' : 'rgba(255,255,255,0.2)' }}></span>
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

          {/* Footer */}
          <div className={`flex-shrink-0 ${sidebarCollapsed ? 'p-2' : 'p-4'} space-y-2`} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            {/* User & Store ID Section */}
            <div className={`flex flex-col gap-2 ${sidebarCollapsed ? 'items-center' : 'px-1'}`}>
              <div className={`flex items-center gap-3 w-full ${sidebarCollapsed ? 'justify-center py-2' : 'px-3 py-3'} rounded-2xl bg-white/5 border border-white/10 relative group hover:bg-white/10 transition-all duration-300`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10 flex-shrink-0 shadow-inner">
                  <User className="w-5 h-5 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-0.5">Logged in as</p>
                    <p className="text-sm font-bold text-white truncate leading-tight">{userName || 'User'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3 text-purple-400" />
                      <p className="text-[11px] text-purple-200/70 truncate font-semibold">{businessName}</p>
                    </div>
                  </div>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 text-white text-xs font-medium rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-50 whitespace-nowrap scale-95 group-hover:scale-100" style={{ backgroundColor: 'var(--sidebar-bg, #1e293b)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">User Profile</p>
                      <p className="font-bold text-sm">{userName || 'User'}</p>
                      <div className="flex items-center gap-1.5 py-1 px-2 rounded-md bg-white/5 border border-white/5">
                        <Building2 className="w-3 h-3 text-purple-400" />
                        <p className="text-[10px] text-white/80">{businessName}</p>
                      </div>
                      {userEmail && <p className="text-[9px] text-white/40 opacity-60 italic">{userEmail}</p>}
                    </div>
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--sidebar-bg, #1e293b)', borderLeft: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Collapse/Expand Toggle Button - Bottom */}
            <button
              onClick={toggleSidebar}
              className={`hidden lg:flex w-full items-center hover:text-white p-2.5 rounded-xl transition-all duration-200 border border-transparent ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'}`}
              style={{ color: 'var(--sidebar-text, #94a3b8)' }}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <div className="rounded-lg p-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </div>
              {!sidebarCollapsed && <span className="text-sm font-medium">Collapse Sidebar</span>}
            </button>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 p-2.5 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/30 ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'
                }`}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">{businessName}</h1>
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Subscription renewal warning banner — only shown to tenants near expiry */}
        {(userRole === 'admin') && <SubscriptionRenewalBanner />}

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
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
