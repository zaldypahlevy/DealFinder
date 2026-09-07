import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, Bell, TrendingDown, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getBestOffer, getPriceHistorySummary } from '../services/marketplaces/dataService'
import { calculateDealScore } from '../services/deal-engine/calculateDealScore'
import { formatRupiah, getDiscountPercent, getStatusColor } from '../utils/format'
import type { Product, Offer, PriceAlert } from '../types'

interface WishlistItem {
  id: string
  product: Product
}

export function WishlistPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [offers, setOffers] = useState<Record<string, Offer>>({})
  const [averages, setAverages] = useState<Record<string, number>>({})
  const [alerts, setAlerts] = useState<Record<string, PriceAlert>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadWishlist()
  }, [user])

  const loadWishlist = async () => {
    if (!user) return
    try {
      const { data: wishData } = await supabase
        .from('wishlists')
        .select('id, product:products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!wishData) return

      const wItems = wishData as unknown as WishlistItem[]
      setItems(wItems)

      const { data: alertData } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)

      const alertMap: Record<string, PriceAlert> = {}
      if (alertData) {
        (alertData as PriceAlert[]).forEach((a) => {
          alertMap[a.product_id] = a
        })
      }
      setAlerts(alertMap)

      const offerMap: Record<string, Offer> = {}
      const avgMap: Record<string, number> = {}
      await Promise.all(
        wItems.map(async (item) => {
          const offer = await getBestOffer(item.product.id)
          if (offer) {
            offerMap[item.product.id] = offer
            const hist = await getPriceHistorySummary(offer.id, 30)
            if (hist) avgMap[item.product.id] = hist.average
          }
        })
      )
      setOffers(offerMap)
      setAverages(avgMap)
    } catch (err) {
      console.error('Failed to load wishlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId: string) => {
    if (!user) return
    await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId)
    setItems(items.filter((i) => i.product.id !== productId))
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-8 w-48 skeleton rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 h-48 skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Wishlist Saya</h1>
      <p className="text-sm text-neutral-500 mb-6">{items.length} produk tersimpan</p>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Belum ada produk di wishlist</h3>
          <p className="text-sm text-neutral-500 mb-4">Simpan produk untuk memantau harganya</p>
          <Link to="/search" className="btn-primary">Mulai cari produk</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const offer = offers[item.product.id]
            const avg = averages[item.product.id]
            const alert = alerts[item.product.id]
            const score = offer ? calculateDealScore(offer, item.product.reference_price, null) : null
            const trend = offer && avg ? ((Number(offer.price) - avg) / avg) * 100 : null
            const discount = offer ? getDiscountPercent(Number(offer.price), item.product.reference_price) : 0

            return (
              <div key={item.id} className="card p-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  <Link to={`/product/${item.product.id}`} className="shrink-0">
                    <div className="h-20 w-20 rounded-xl bg-neutral-100 overflow-hidden">
                      {item.product.image_url && (
                        <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2">{item.product.name}</h3>
                    </Link>
                    <p className="text-xs text-neutral-500 mt-0.5">{item.product.brand}</p>
                    {offer && (
                      <p className="text-lg font-bold text-neutral-900 mt-1">{formatRupiah(Number(offer.price))}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(item.product.id)}
                    className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  {score && (
                    <span className={`badge border ${getStatusColor(score.status)}`}>DF {score.score}</span>
                  )}
                  {trend !== null && (
                    <span className={`text-xs flex items-center gap-0.5 ${
                      trend < 0 ? 'text-success-600' : trend > 0 ? 'text-error-600' : 'text-neutral-400'
                    }`}>
                      {trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      {Math.abs(trend).toFixed(1)}%
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-xs text-error-600 font-medium">-{discount}%</span>
                  )}
                </div>

                {alert ? (
                  <div className="flex items-center gap-2 rounded-lg bg-primary-50 border border-primary-100 px-3 py-2 text-xs">
                    <Bell className="h-3.5 w-3.5 text-primary-600" />
                    <span className="text-primary-700">Alert: {formatRupiah(Number(alert.target_price))}</span>
                  </div>
                ) : (
                  <Link to={`/product/${item.product.id}`} className="text-xs text-primary-600 font-medium hover:underline">
                    Set target harga →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
