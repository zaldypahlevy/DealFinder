import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo } from '../components/Logo'
import { Mail, Lock, AlertCircle, Shield } from 'lucide-react'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Email atau password salah. Silakan coba lagi.')
    } else {
      navigate(redirect)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" showText={false} />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Masuk ke DealFinder</h1>
        <p className="text-sm text-neutral-500 mt-1">Masuk untuk menyimpan wishlist dan price alert</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-semibold text-neutral-700 block mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              className="input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-neutral-700 block mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimal 6 karakter"
              className="input pl-10"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
        <p className="text-sm text-center text-neutral-500">
          Belum punya akun?{' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-primary-600 hover:text-primary-700">
            Daftar
          </Link>
        </p>
      </form>

      {/* Demo Admin Login */}
      <div className="mt-4 card p-4 border-dashed border-neutral-300">
        <p className="text-xs text-neutral-500 text-center mb-3">Demo: langsung masuk sebagai admin</p>
        <button
          onClick={async () => {
            setLoading(true)
            setError(null)
            const { error } = await signIn('admin@dealfinder.com', 'admin123')
            setLoading(false)
            if (error) {
              setError('Akun demo admin belum dibuat. Daftar dengan email admin@dealfinder.com untuk akses admin otomatis.')
            } else {
              navigate('/admin')
            }
          }}
          disabled={loading}
          className="btn-secondary w-full text-sm"
        >
          <Shield className="h-4 w-4 text-primary-600" />
          Demo Admin Login
        </button>
      </div>
    </div>
  )
}
