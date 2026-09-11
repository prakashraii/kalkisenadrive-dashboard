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
import { toast } from 'sonner'
import { useAuth } from '../store/auth'
import { usePageSearch } from '../store/page-search'

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
  { to: '/payments', label: 'Manage Accounts', icon: CreditCard },
  { to: '/notifications', label: 'Notification', icon: Bell },
]

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'User List',
  '/donations': 'Donation',
  '/memberships': 'Membership',
  '/clinics': 'Clinic List',
  '/drivers': 'Drivers List',
  '/books': 'Books Sell',
  '/books/orders': 'Book Orders',
  '/videos': 'Video List',
  '/payments': 'Manage Accounts',
  '/notifications': 'Notification',
}

export function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, setAdmin } = useAuth()
  const headerSearch = usePageSearch((s) => s.query)
  const setHeaderSearch = usePageSearch((s) => s.setQuery)
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setHeaderSearch('')
  }, [location.pathname, setHeaderSearch])

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
  const userView = location.pathname === '/users' && params.get('view')
  const formTitle =
    location.pathname === '/users' && (formMode || userView)
      ? formMode === 'new'
        ? 'Add User'
        : 'User Details'
      : null
  const donationTabLabels: Record<string, string> = {
    all: 'Donation',
    dowry: 'Dowry Donation',
    doctor: 'Doctor Donation',
    general: 'General Donation',
  }
  const donationTabLabel = donationTabLabels[params.get('tab') ?? 'all'] ?? 'Donation'
  const donationView = location.pathname === '/donations' && params.get('view')
  const donationForm = location.pathname === '/donations' && formMode === 'new'
  const donationTitle = location.pathname === '/donations'
    ? donationForm
      ? 'Record Donation'
      : donationView
        ? 'User Details'
        : donationTabLabel
    : null
  const membershipView = location.pathname === '/memberships' && params.get('view')
  const membershipForm = location.pathname === '/memberships' && formMode
  const membershipTitle = membershipForm
    ? formMode === 'plan'
      ? 'Add Plan'
      : 'Add Membership'
    : membershipView
      ? 'Member Details'
      : null
  const clinicForm = location.pathname === '/clinics' && formMode
  const clinicView = location.pathname === '/clinics' && params.get('view')
  const clinicTitle = location.pathname === '/clinics'
    ? clinicForm === 'new'
      ? 'Add Clinic'
      : clinicForm || clinicView
        ? 'Clinic Details'
        : 'Clinic List'
    : null
  const bookForm = location.pathname === '/books' && formMode
  const bookView = location.pathname === '/books' && params.get('view')
  const bookTitle = location.pathname === '/books'
    ? bookForm === 'new'
      ? 'Add Book'
      : bookForm || bookView
        ? 'Book Details'
        : 'Books Sell'
    : null
  const orderView = location.pathname === '/books/orders' && params.get('view')
  const orderTitle = orderView ? 'Order Details' : null
  const driverForm = location.pathname === '/drivers' && formMode === 'new'
  const driverView = location.pathname === '/drivers' && params.get('view')
  const driverTitle = location.pathname === '/drivers'
    ? driverForm
      ? 'Add Registration'
      : driverView
        ? 'Driver Details'
        : null
    : null
  const videoForm = location.pathname === '/videos' && (formMode || params.get('view'))
  const videoUploadTitle = params.get('tab') === 'link' ? 'Upload Link' : 'Upload Video'
  const videoTitle = location.pathname === '/videos'
    ? formMode === 'new'
      ? videoUploadTitle
      : videoForm
        ? 'Video Details'
        : 'Video List'
    : null
  const notificationForm = location.pathname === '/notifications' && formMode === 'new'
  const notificationTitle = notificationForm ? 'Send Notification' : null
  const paymentForm = location.pathname === '/payments' && formMode
  const paymentView = location.pathname === '/payments' && params.get('view')
  const paymentWallet = params.get('type') === 'wallet'
  const paymentTitle = location.pathname === '/payments'
    ? paymentForm
      ? paymentWallet
        ? paymentForm === 'new'
          ? 'Add Wallet Details'
          : 'Wallet Details'
        : 'Payment Setting'
      : paymentView
        ? 'Payment Details'
        : 'Manage Accounts'
    : null
  const detailTitle = formTitle ?? donationTitle ?? membershipTitle ?? clinicTitle ?? bookTitle ?? orderTitle ?? driverTitle ?? videoTitle ?? paymentTitle ?? notificationTitle
  const title = detailTitle ?? titles[location.pathname] ?? 'Dashboard'
  const crumb = formTitle ? (
    <>
      Menu / User List / <span className="text-[#7EB6FF]">{formTitle}</span>
    </>
  ) : donationForm ? (
    <>
      Menu / {donationTabLabel} / <span className="text-[#7EB6FF]">Record Donation</span>
    </>
  ) : donationView ? (
    <>
      Menu / {donationTabLabel} User List / <span className="text-[#7EB6FF]">User Details</span>
    </>
  ) : membershipForm ? (
    <>
      Menu / Membership / <span className="text-[#7EB6FF]">{membershipTitle}</span>
    </>
  ) : membershipView ? (
    <>
      Menu / Membership / <span className="text-[#7EB6FF]">Member Details</span>
    </>
  ) : clinicForm || clinicView ? (
    <>
      Menu / Clinic / <span className="text-[#7EB6FF]">{clinicTitle}</span>
    </>
  ) : bookForm || bookView ? (
    <>
      Menu / Book / <span className="text-[#7EB6FF]">{bookTitle}</span>
    </>
  ) : orderView ? (
    <>
      Menu / Book Orders / <span className="text-[#7EB6FF]">Order Details</span>
    </>
  ) : driverForm || driverView ? (
    <>
      Menu / Drivers / <span className="text-[#7EB6FF]">{driverTitle}</span>
    </>
  ) : videoForm ? (
    <>
      Menu / Video / <span className="text-[#7EB6FF]">{videoTitle}</span>
    </>
  ) : paymentForm ? (
    <>
      Menu / Manage Accounts /{' '}
      <span className="text-[#7EB6FF]">
        {paymentWallet ? (params.get('form') === 'new' ? 'Add Wallet Details' : 'Wallet Details') : 'Payment Setting'}
      </span>
    </>
  ) : paymentView ? (
    <>
      Menu / Manage Accounts / <span className="text-[#7EB6FF]">Payment Details</span>
    </>
  ) : notificationForm ? (
    <>
      Menu / Notification / <span className="text-[#7EB6FF]">Send Notification</span>
    </>
  ) : location.pathname === '/videos' && !videoForm ? (
    <>
      Menu / <span className="text-[#7EB6FF]">Video List</span>
    </>
  ) : location.pathname === '/clinics' ? (
    'Menu / Clinics List'
  ) : location.pathname === '/books' ? (
    'Menu / Book Sell'
  ) : (
    `Menu / ${title}`
  )

  async function logout() {
    try {
      await api.post('/admin/auth/logout')
    } catch {
      // Session is cleared locally either way.
    }
    setAdmin(null)
    toast.success('Signed out')
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
              <Search className="size-5 shrink-0 text-white/60" aria-hidden="true" />
              <input
                type="search"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Type to search..."
                aria-label="Search"
                className="w-full bg-transparent text-white outline-none placeholder:text-white/60 [&::-webkit-search-cancel-button]:hidden"
              />
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
