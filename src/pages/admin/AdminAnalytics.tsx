import { useState, useEffect } from 'react'
import { Search, MousePointerClick, Bell } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate, formatRupiah } from '../../utils/format'

interface AffiliateClickRow {
  id: string
  clicked_at: string
  product: { name: string } | null
  marketplace: { name: string } | null
}

interface SearchRow {
  id: string
  query: string
  results_count: number
  created_at: string
}

interface AlertRow {
  id: string
  target_price: number
  active: boolean
  created_at: string
  product: { name: string } | null
}

export function AdminAnalytics() {
  const [clicks, setClicks] = useState<AffiliateClickRow[]>([])
  const [searches, setSearches] = useState<SearchRow[]>([])
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clickRes, searchRes, alertRes] = await Promise.all([
        supabase
          .from('affiliate_clicks')
          .select('id, clicked_at, product:products(name), marketplace:marketplaces(name)')
          .order('clicked_at', { ascending: false })
          .limit(20),
        supabase
          .from('searches')
          .select('id, query, results_count, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('price_alerts')
          .select('id, target_price, active, created_at, product:products(name)')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (clickRes.data) setClicks(clickRes.data as unknown as AffiliateClickRow[])
      if (searchRes.data) setSearches(searchRes.data as SearchRow[])
      if (alertRes.data) setAlerts(alertRes.data as unknown as AlertRow[])
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-neutral-400" />
            <h2 className="font-semibold text-neutral-900">Recent Searches</h2>
          </div>
          {loading ? (
            <p className="text-sm text-neutral-400">Memuat...</p>
          ) : searches.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada data</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searches.map((s) => (
                <div key={s.id} className="text-sm py-2 border-b border-neutral-100 last:border-0">
                  <p className="font-medium text-neutral-700">{s.query}</p>
                  <p className="text-xs text-neutral-400">{s.results_count} hasil • {formatDate(s.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="h-5 w-5 text-neutral-400" />
            <h2 className="font-semibold text-neutral-900">Affiliate Clicks</h2>
          </div>
          {loading ? (
            <p className="text-sm text-neutral-400">Memuat...</p>
          ) : clicks.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada data</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {clicks.map((c) => (
                <div key={c.id} className="text-sm py-2 border-b border-neutral-100 last:border-0">
                  <p className="font-medium text-neutral-700 truncate">{c.product?.name || '-'}</p>
                  <p className="text-xs text-neutral-400">{c.marketplace?.name || '-'} • {formatDate(c.clicked_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-neutral-400" />
            <h2 className="font-semibold text-neutral-900">Price Alerts</h2>
          </div>
          {loading ? (
            <p className="text-sm text-neutral-400">Memuat...</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada data</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {alerts.map((a) => (
                <div key={a.id} className="text-sm py-2 border-b border-neutral-100 last:border-0">
                  <p className="font-medium text-neutral-700 truncate">{a.product?.name || '-'}</p>
                  <p className="text-xs text-neutral-400">
                    Target: {formatRupiah(Number(a.target_price))} • {a.active ? 'Aktif' : 'Nonaktif'} • {formatDate(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
