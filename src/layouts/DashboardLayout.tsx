import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Building2,
  CarFront,
  ChevronDown,
  CreditCard,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Users,
  Video,
  BadgeCheck,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import { useAuth } from '../store/auth'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/donations', label: 'Donation', icon: HeartHandshake },
  { to: '/memberships', label: 'Membership', icon: BadgeCheck },
  { to: '/clinics', label: 'Kalki Sena Clinic', icon: Building2 },
  { to: '/drivers', label: 'Driver Registration', icon: CarFront },
  {
    label: 'Book',
    icon: BookOpen,
    children: [
      { to: '/books', label: 'Book list', end: true },
      { to: '/books/orders', label: 'Book orders' },
    ],
  },
  { to: '/videos', label: 'Video', icon: Video },
  { to: '/payments', label: 'Bank & Payments', icon: CreditCard },
  { to: '/notifications', label: 'Push Notification', icon: Bell },
]

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'User List',
  '/donations': 'Donation',
  '/memberships': 'Membership',
  '/clinics': 'Kalki Sena Clinic',
  '/drivers': 'Driver Registration',
  '/books': 'Book',
  '/books/orders': 'Book Orders',
  '/videos': 'Video',
  '/payments': 'Bank & Payments',
  '/notifications': 'Push Notification',
}

export function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, setAdmin } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    api
      .get('/admin/auth/me')
      .then((res) => setAdmin(res.data))
      .catch(() => navigate('/login'))
  }, [navigate, setAdmin])

  const { data: notes } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => (await api.get('/admin/notifications', { params: { limit: 5 } })).data,
    enabled: !!admin,
  })

  const params = new URLSearchParams(location.search)
  const formMode = params.get('form')
  const formTitle = formMode === 'new' ? 'Add User' : formMode === 'edit' || formMode === 'view' ? 'User Details' : null
  const donationTabLabels: Record<string, string> = {
    all: 'Donation',
    dowry: 'Dowry Donation',
    doctor: 'Doctor Donation',
    general: 'General Donation',
  }
  const donationTabLabel = donationTabLabels[params.get('tab') ?? 'all'] ?? 'Donation'
  const donationView = location.pathname === '/donations' && params.get('view')
  const donationTitle = location.pathname === '/donations' ? (donationView ? 'User Details' : donationTabLabel) : null
  const membershipView = location.pathname === '/memberships' && params.get('view')
  const membershipTitle = membershipView ? 'Member Details' : null
  const title = formTitle ?? donationTitle ?? membershipTitle ?? titles[location.pathname] ?? 'Dashboard'
  const crumb = formTitle ? (
    <>
      Menu / User List / <span className="text-[#7EB6FF]">{formTitle}</span>
    </>
  ) : donationView ? (
    <>
      Menu / {donationTabLabel} User List / <span className="text-[#7EB6FF]">User Details</span>
    </>
  ) : membershipView ? (
    <>
      Menu / Membership / <span className="text-[#7EB6FF]">Member Details</span>
    </>
  ) : (
    `Menu / ${title}`
  )

  async function logout() {
    await api.post('/admin/auth/logout')
    setAdmin(null)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-page">
      <aside className={cn('flex h-screen flex-col bg-sidebar text-white transition-all', collapsed ? 'w-[76px]' : 'w-[198px]')}>
        <div className={cn('flex items-center justify-center px-3', collapsed ? 'h-[65px]' : 'py-3')}>
          <img
            src="/kalki-sena-logo.png"
            alt="Kalki Sena Drive"
            className={cn('object-contain', collapsed ? 'h-10 w-10' : 'h-auto w-full')}
          />
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {nav.map((item) =>
            'children' in item && item.children ? (
              <NavGroup key={item.label} item={item} collapsed={collapsed} />
            ) : (
              <NavItem key={item.label} item={item as { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }} collapsed={collapsed} />
            ),
          )}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[82px] items-center gap-6 bg-header px-8 shadow-[0_-2px_14px_rgba(0,0,0,0.25)]">
          <button onClick={() => setCollapsed((v) => !v)} className="rounded p-1 hover:bg-white/10">
            <Menu className="size-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-normal text-white">{title}</h1>
            <p className="text-xs text-white/80">{crumb}</p>
          </div>
          <div className="mx-auto hidden w-full max-w-xl flex-1 md:block">
            <label className="flex h-11 items-center gap-2.5 rounded-md border border-white/30 px-4 text-xs">
              <Search className="size-5 text-white/60" />
              <input placeholder="Type to search..." className="w-full bg-transparent text-white outline-none placeholder:text-white/60" />
            </label>
          </div>
          <div className="ml-auto flex items-center gap-6">
            <button className="relative flex size-[58px] items-center justify-center rounded-full bg-white/20" onClick={() => navigate('/notifications')}>
              <Bell className="size-8 text-white" />
              {notes?.unread > 0 && <span className="absolute right-3.5 top-3.5 size-2 rounded-full bg-red-500" />}
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2.5">
                <div className="hidden text-right sm:block">
                  <p className="text-base text-white">{admin?.name ?? 'Admin'}</p>
                  <p className="text-xs font-semibold text-[#AEAEB2]">{admin?.role === 'SUPER_ADMIN' ? 'Admin' : admin?.role ?? 'Admin'}</p>
                </div>
                <img
                  src={admin?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name ?? 'Admin')}&background=001E5E&color=fff`}
                  alt=""
                  className="size-[50px] rounded-full object-cover"
                />
                <ChevronDown className="size-3 text-white" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <button onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                    <LogOut className="size-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavItem({
  item,
  collapsed,
}: {
  item: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }
  collapsed: boolean
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-1.5 py-2.5 text-sm text-white hover:bg-sidebar-hover',
          isActive && 'border border-white px-3',
          collapsed && 'justify-center px-0',
        )
      }
    >
      <item.icon className="size-4 shrink-0" />
      {!collapsed && item.label}
    </NavLink>
  )
}

function NavGroup({
  item,
  collapsed,
}: {
  item: { label: string; icon: typeof LayoutDashboard; children: { to: string; label: string; end?: boolean }[] }
  collapsed: boolean
}) {
  const location = useLocation()
  const openDefault = item.children.some((c) => location.pathname.startsWith(c.to))
  const [open, setOpen] = useState(openDefault)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-1.5 py-2.5 text-sm text-white hover:bg-sidebar-hover',
          collapsed && 'justify-center px-0',
        )}
      >
        <item.icon className="size-4 shrink-0" />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {!collapsed && <ChevronDown className={cn('size-4 transition', open && 'rotate-180')} />}
      </button>
      {open && !collapsed && (
        <div className="ml-8 mt-1 space-y-1">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              className={({ isActive }) =>
                cn('block rounded-lg px-3 py-1.5 text-sm text-white/60 hover:text-white', isActive && 'text-white')
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
