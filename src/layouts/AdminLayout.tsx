import { Outlet, NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Package, Tags, Users, BarChart3, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Logo } from '../components/Logo'

export function AdminLayout() {
  const { user } = useAuth()

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/offers', icon: Tags, label: 'Offers' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50">
      <aside className="lg:w-64 bg-neutral-900 text-neutral-400 lg:min-h-screen flex lg:flex-col flex-row overflow-x-auto">
        <div className="p-4 hidden lg:block">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Logo size="sm" className="[&_span]:text-white" />
            <span className="font-bold hidden lg:inline">Admin</span>
          </Link>
        </div>
        <nav className="flex lg:flex-col flex-row gap-1 p-2 lg:p-4 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-primary-600 text-white' : 'hover:bg-neutral-800 hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 hidden lg:block border-t border-neutral-800">
          <p className="text-xs text-neutral-500 mb-2">{user?.email}</p>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white">
            <ArrowLeft className="h-3 w-3" />
            Kembali ke app
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-x-auto">
        <Outlet />
      </div>
    </div>
  )
}
