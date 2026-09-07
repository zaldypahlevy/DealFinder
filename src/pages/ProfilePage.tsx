import { useNavigate, Link } from 'react-router-dom'
import { User as UserIcon, Mail, Calendar, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/format'

export function ProfilePage() {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Profil Saya</h1>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{user.email}</h2>
            {isAdmin && (
              <span className="badge bg-primary-100 text-primary-700 border border-primary-200 mt-1">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 py-2 border-b border-neutral-100">
            <Mail className="h-4 w-4 text-neutral-400" />
            <span className="text-neutral-500">Email</span>
            <span className="ml-auto font-medium text-neutral-900">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 py-2 border-b border-neutral-100">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-neutral-500">Bergabung sejak</span>
            <span className="ml-auto font-medium text-neutral-900">
              {user.created_at ? formatDate(user.created_at) : '-'}
            </span>
          </div>
        </div>
      </div>

      {isAdmin && (
        <a href="/admin" className="card p-4 mb-6 flex items-center gap-3 hover:border-neutral-300 transition">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900">Admin Dashboard</h3>
            <p className="text-xs text-neutral-500">Kelola produk, offer, dan lihat analytics</p>
          </div>
          <span className="text-neutral-400">&rarr;</span>
        </a>
      )}

      {!isAdmin && (
        <Link to="/admin" className="card p-4 mb-6 flex items-center gap-3 hover:border-neutral-300 transition">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900">Admin Dashboard</h3>
            <p className="text-xs text-neutral-500">Akses dashboard admin untuk demo</p>
          </div>
          <span className="text-neutral-400">&rarr;</span>
        </Link>
      )}

      <button onClick={handleSignOut} className="btn-secondary w-full text-error-600 border-error-200 hover:bg-error-50">
        <LogOut className="h-4 w-4" />
        Keluar
      </button>
    </div>
  )
}
