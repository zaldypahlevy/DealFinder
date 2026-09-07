import { useState, useEffect } from 'react'
import { Users, Package, Tags, Bell, MousePointerClick, Search, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    offers: 0,
    alerts: 0,
    clicks: 0,
    searches: 0,
  })
  const [topSearches, setTopSearches] = useState<{ query: string; count: number }[]>([])
  const [topWishlists, setTopWishlists] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [users, products, offers, alerts, clicks, searches] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('offers').select('id', { count: 'exact', head: true }),
        supabase.from('price_alerts').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('affiliate_clicks').select('id', { count: 'exact', head: true }),
        supabase.from('searches').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        users: users.count || 0,
        products: products.count || 0,
        offers: offers.count || 0,
        alerts: alerts.count || 0,
        clicks: clicks.count || 0,
        searches: searches.count || 0,
      })

      const { data: searchData } = await supabase
        .from('searches')
        .select('query')
        .limit(100)
      if (searchData) {
        const counts: Record<string, number> = {}
        searchData.forEach((s: { query: string }) => {
          counts[s.query] = (counts[s.query] || 0) + 1
        })
        setTopSearches(
          Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([query, count]) => ({ query, count }))
        )
      }

      const { data: wishData } = await supabase
        .from('wishlists')
        .select('product:products(name)')
        .limit(100)
      if (wishData) {
        const counts: Record<string, number> = {}
        wishData.forEach((w: Record<string, { name: string } | { name: string }[] | null>) => {
          const product = Array.isArray(w.product) ? w.product[0] : w.product
          if (product?.name) {
            counts[product.name] = (counts[product.name] || 0) + 1
          }
        })
        setTopWishlists(
          Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))
        )
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-primary-600 bg-primary-100' },
    { label: 'Total Products', value: stats.products, icon: Package, color: 'text-success-600 bg-success-100' },
    { label: 'Total Offers', value: stats.offers, icon: Tags, color: 'text-accent-600 bg-accent-100' },
    { label: 'Active Alerts', value: stats.alerts, icon: Bell, color: 'text-warning-600 bg-warning-100' },
    { label: 'Affiliate Clicks', value: stats.clicks, icon: MousePointerClick, color: 'text-error-600 bg-error-100' },
    { label: 'Total Searches', value: stats.searches, icon: Search, color: 'text-neutral-600 bg-neutral-100' },
  ]

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {loading ? '...' : card.value}
            </p>
            <p className="text-xs text-neutral-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-neutral-400" />
            <h2 className="font-semibold text-neutral-900">Top Searches</h2>
          </div>
          {topSearches.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada data</p>
          ) : (
            <div className="space-y-2">
              {topSearches.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-neutral-700">{s.query}</span>
                  <span className="font-semibold text-neutral-900">{s.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-neutral-400" />
            <h2 className="font-semibold text-neutral-900">Top Wishlist Products</h2>
          </div>
          {topWishlists.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada data</p>
          ) : (
            <div className="space-y-2">
              {topWishlists.map((w, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-neutral-700 truncate">{w.name}</span>
                  <span className="font-semibold text-neutral-900 shrink-0 ml-2">{w.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
