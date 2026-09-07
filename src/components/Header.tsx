import { Link, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { Search, Heart, Bell, User as UserIcon, Home, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Logo } from './Logo'

export function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="shrink-0">
              <Logo size="md" />
            </Link>

            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Contoh: iPhone 17 Pro 256GB"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none focus:bg-white transition"
                />
              </div>
            </form>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" icon={<Home className="h-4 w-4" />} label="Beranda" />
              <NavLink to="/search" icon={<Search className="h-4 w-4" />} label="Cari" />
              {user && (
                <>
                  <NavLink to="/wishlist" icon={<Heart className="h-4 w-4" />} label="Wishlist" />
                  <NavLink to="/alerts" icon={<Bell className="h-4 w-4" />} label="Alert" />
                  <NavLink to="/profile" icon={<UserIcon className="h-4 w-4" />} label="Profil" />
                </>
              )}
              {!user ? (
                <Link to="/login" className="btn-primary ml-2">
                  Masuk
                </Link>
              ) : (
                <button
                  onClick={() => signOut()}
                  className="ml-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              )}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-neutral-600 hover:bg-neutral-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-neutral-200 py-4 space-y-3 animate-slide-down">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contoh: iPhone 17 Pro 256GB"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </form>
              <div className="grid grid-cols-2 gap-2">
                <MobileNavLink to="/" icon={<Home className="h-5 w-5" />} label="Beranda" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavLink to="/search" icon={<Search className="h-5 w-5" />} label="Cari" onClick={() => setMobileMenuOpen(false)} />
                {user && (
                  <>
                    <MobileNavLink to="/wishlist" icon={<Heart className="h-5 w-5" />} label="Wishlist" onClick={() => setMobileMenuOpen(false)} />
                    <MobileNavLink to="/alerts" icon={<Bell className="h-5 w-5" />} label="Alert" onClick={() => setMobileMenuOpen(false)} />
                    <MobileNavLink to="/profile" icon={<UserIcon className="h-5 w-5" />} label="Profil" onClick={() => setMobileMenuOpen(false)} />
                    <button
                      onClick={() => { signOut(); setMobileMenuOpen(false) }}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                    >
                      <LogOut className="h-5 w-5" />
                      Keluar
                    </button>
                  </>
                )}
                {!user && (
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-primary col-span-2">
                    Masuk / Daftar
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <MobileBottomNav user={user} />
    </>
  )
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition"
    >
      {icon}
      {label}
    </Link>
  )
}

function MobileNavLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
    >
      {icon}
      {label}
    </Link>
  )
}

function MobileBottomNav({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  const items = [
    { to: '/', icon: Home, label: 'Beranda' },
    { to: '/search', icon: Search, label: 'Cari' },
    ...(user
      ? [
          { to: '/wishlist', icon: Heart, label: 'Wishlist' },
          { to: '/alerts', icon: Bell, label: 'Alert' },
          { to: '/profile', icon: UserIcon, label: 'Profil' },
        ]
      : [
          { to: '/wishlist', icon: Heart, label: 'Wishlist' },
          { to: '/alerts', icon: Bell, label: 'Alert' },
          { to: '/login', icon: UserIcon, label: 'Masuk' },
        ]),
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="relative flex flex-col items-center gap-0.5 text-neutral-500 hover:text-primary-600 transition-colors group"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-primary-600 rounded-full transition-all duration-200 group-hover:w-5" />
          </Link>
        ))}
      </div>
    </nav>
  )
}
