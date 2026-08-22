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
  '/users': 'Users',
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

  const title = titles[location.pathname] ?? 'Dashboard'

  async function logout() {
    await api.post('/admin/auth/logout')
    setAdmin(null)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-page">
      <aside className={cn('flex h-screen flex-col bg-sidebar text-white transition-all', collapsed ? 'w-[76px]' : 'w-[250px]')}>
        <div className="flex h-[88px] items-center justify-center gap-2 border-b border-white/10 px-3">
          <img src="/logo.svg" alt="Kalki Sena Drive" className="h-12 w-12 rounded-full object-cover" />
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">KALKI SENA</p>
              <p className="text-xs text-white/70">DRIVE.</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
        <header className="flex h-[72px] items-center gap-4 border-b border-slate-200 bg-white px-6">
          <button onClick={() => setCollapsed((v) => !v)} className="rounded p-1 hover:bg-slate-100">
            <Menu className="size-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-400">Menu / {title}</p>
          </div>
          <div className="mx-auto hidden w-full max-w-md md:block">
            <label className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm">
              <Search className="size-4 text-slate-400" />
              <input placeholder="Type to search..." className="w-full bg-transparent outline-none" />
            </label>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-full p-2 hover:bg-slate-100" onClick={() => navigate('/notifications')}>
              <Bell className="size-5 text-slate-600" />
              {notes?.unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500" />}
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2">
                <img
                  src={admin?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name ?? 'Admin')}&background=6d5efc&color=fff`}
                  alt=""
                  className="size-9 rounded-full object-cover"
                />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium">{admin?.name ?? 'Admin'}</p>
                  <p className="text-xs text-slate-400">{admin?.role === 'SUPER_ADMIN' ? 'Admin' : admin?.role ?? 'Admin'}</p>
                </div>
                <ChevronDown className="size-4 text-slate-400" />
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
        <main className="min-h-0 flex-1 overflow-y-auto p-5">
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
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-sidebar-hover hover:text-white',
          isActive && 'bg-sidebar-active text-white',
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
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-sidebar-hover hover:text-white',
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
