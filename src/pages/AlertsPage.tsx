import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Trash2, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getBestOffer } from '../services/marketplaces/dataService'
import { formatRupiah } from '../utils/format'
import type { Product, PriceAlert as PriceAlertType, Offer } from '../types'

export function AlertsPage() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<(PriceAlertType & { product?: Product })[]>([])
  const [offers, setOffers] = useState<Record<string, Offer>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadAlerts()
  }, [user])

  const loadAlerts = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('price_alerts')
        .select('*, product:products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!data) return
      setAlerts(data as unknown as (PriceAlertType & { product?: Product })[])

      const offerMap: Record<string, Offer> = {}
      await Promise.all(
        (data as unknown as PriceAlertType[]).map(async (alert) => {
          const offer = await getBestOffer(alert.product_id)
          if (offer) offerMap[alert.product_id] = offer
        })
      )
      setOffers(offerMap)
    } catch (err) {
      console.error('Failed to load alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('price_alerts').delete().eq('id', id)
    setAlerts(alerts.filter((a) => a.id !== id))
  }

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('price_alerts').update({ active: !current }).eq('id', id)
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, active: !current } : a)))
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-8 w-48 skeleton rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 h-24 skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Price Alerts</h1>
      <p className="text-sm text-neutral-500 mb-6">{alerts.length} alert aktif</p>

      {alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Belum ada price alert</h3>
          <p className="text-sm text-neutral-500 mb-4">Buat alert untuk tahu kapan harga turun</p>
          <Link to="/search" className="btn-primary">Temukan produk</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const offer = offers[alert.product_id]
            const currentPrice = offer ? Number(offer.price) : null
            const targetPrice = Number(alert.target_price)
            const isTriggered = currentPrice !== null && currentPrice <= targetPrice
            const progress = currentPrice && currentPrice > 0
              ? Math.min(100, ((targetPrice / currentPrice) * 100))
              : 0

            return (
              <div key={alert.id} className={`card p-4 ${!alert.active ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <Link to={`/product/${alert.product_id}`} className="shrink-0">
                    <div className="h-16 w-16 rounded-xl bg-neutral-100 overflow-hidden">
                      {alert.product?.image_url && (
                        <img src={alert.product.image_url} alt={alert.product.name} className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${alert.product_id}`}>
                      <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1">{alert.product?.name}</h3>
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-neutral-500">Target: <span className="font-semibold text-neutral-700">{formatRupiah(targetPrice)}</span></span>
                      {currentPrice !== null && (
                        <span className="text-neutral-500">Sekarang: <span className="font-semibold text-neutral-700">{formatRupiah(currentPrice)}</span></span>
                      )}
                    </div>
                    {progress > 0 && alert.active && (
                      <div className="mt-2 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isTriggered ? 'bg-success-500' : 'bg-primary-500'}`}
                          style={{ width: `${100 - progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTriggered && alert.active && (
                      <span className="badge bg-success-100 text-success-700 border border-success-200">
                        <CheckCircle className="h-3 w-3" />
                        Tercapai
                      </span>
                    )}
                    <button
                      onClick={() => handleToggle(alert.id, alert.active)}
                      className={`relative h-6 w-11 rounded-full transition ${alert.active ? 'bg-primary-600' : 'bg-neutral-300'}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${alert.active ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
