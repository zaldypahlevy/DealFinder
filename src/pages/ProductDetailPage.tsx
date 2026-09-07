import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Bell, ShoppingCart, Star, ArrowLeft, TrendingDown, TrendingUp, Info, X, Trophy } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  getProductById,
  getOffersByProduct,
  getPriceHistorySummary,
  trackAffiliateClick,
} from '../services/marketplaces/dataService'
import { calculateDealScore, getDealRecommendation } from '../services/deal-engine/calculateDealScore'
import { DFScoreDisplay, DFScoreBreakdown } from '../components/DFScoreDisplay'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { formatRupiah, formatCompactNumber, getDiscountPercent, getStatusColor, getStatusDot } from '../utils/format'
import type { Product, Offer, PriceHistorySummary, DealScore, DealRecommendation } from '../types'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyDays, setHistoryDays] = useState<30 | 7 | 90>(30)
  const [historySummary, setHistorySummary] = useState<PriceHistorySummary | null>(null)
  const [bestOfferScore, setBestOfferScore] = useState<DealScore | null>(null)
  const [recommendation, setRecommendation] = useState<DealRecommendation | null>(null)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')
  const [alertError, setAlertError] = useState<string | null>(null)
  const [alertSuccess, setAlertSuccess] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [id])

  useEffect(() => {
    if (offers.length > 0 && offers[0].id) {
      loadHistory(offers[0].id, historyDays)
    }
  }, [offers, historyDays])

  useEffect(() => {
    if (user && id) {
      supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle()
        .then(({ data }) => setInWishlist(!!data))
    }
  }, [user, id])

  const loadProduct = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const p = await getProductById(id)
      if (!p) {
        setError('Produk tidak ditemukan')
        return
      }
      setProduct(p)
      const offs = await getOffersByProduct(id)
      setOffers(offs)
      if (offs.length > 0) {
        const hist = await getPriceHistorySummary(offs[0].id, 30)
        setHistorySummary(hist)
        const score = calculateDealScore(offs[0], p.reference_price, hist)
        setBestOfferScore(score)
        setRecommendation(getDealRecommendation(score, hist))
      }
    } catch (err) {
      console.error('Failed to load product:', err)
      setError('Gagal memuat produk. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async (offerId: string, days: number) => {
    const hist = await getPriceHistorySummary(offerId, days)
    setHistorySummary(hist)
    if (product && offers.length > 0) {
      const score = calculateDealScore(offers[0], product.reference_price, hist)
      setBestOfferScore(score)
      setRecommendation(getDealRecommendation(score, hist))
    }
  }

  const handleBuyNow = async (offer: Offer) => {
    if (!product || !offer.affiliate_url) return
    await trackAffiliateClick(product.id, offer.id, offer.marketplace_id, user?.id)
    window.open(offer.affiliate_url, '_blank')
  }

  const handlePantauHarga = () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/product/${id}`))
      return
    }
    setShowAlertModal(true)
  }

  const handleSetAlert = async () => {
    if (!user || !product || !targetPrice) return
    setAlertError(null)
    const tp = Number(targetPrice)
    if (isNaN(tp) || tp <= 0) {
      setAlertError('Harga target tidak valid')
      return
    }
    const { error: alertErr } = await supabase.from('price_alerts').insert({
      user_id: user.id,
      product_id: product.id,
      target_price: tp,
    })
    if (alertErr) {
      setAlertError('Gagal membuat alert. Silakan coba lagi.')
      return
    }
    if (!inWishlist) {
      await supabase.from('wishlists').insert({
        user_id: user.id,
        product_id: product.id,
      })
      setInWishlist(true)
    }
    setAlertSuccess(true)
  }

  const handleAddWishlist = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/product/${id}`))
      return
    }
    if (!product) return
    if (inWishlist) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id)
      setInWishlist(false)
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id })
      setInWishlist(true)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square rounded-2xl skeleton" />
          <div className="space-y-4">
            <div className="h-4 w-1/4 skeleton rounded" />
            <div className="h-8 w-full skeleton rounded" />
            <div className="h-12 w-1/2 skeleton rounded" />
            <div className="h-32 w-full skeleton rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-neutral-500 mb-4">{error || 'Produk tidak ditemukan'}</p>
        <Link to="/search" className="btn-primary">Cari Produk Lain</Link>
      </div>
    )
  }

  const bestOffer = offers[0]
  const discount = getDiscountPercent(Number(bestOffer.price), product.reference_price)
  const priceDiff = historySummary
    ? ((Number(bestOffer.price) - historySummary.average) / historySummary.average) * 100
    : null
  const pricePosition = historySummary
    ? ((Number(bestOffer.price) - historySummary.lowest) / (historySummary.highest - historySummary.lowest)) * 100
    : null

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <Link to={-1 as unknown as string} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      {/* Product Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="aspect-square rounded-2xl bg-white border border-neutral-200 overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-neutral-300">
              <span className="text-6xl font-bold">{product.brand.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-primary-600">{product.brand}</span>
              {product.category && (
                <span className="text-xs text-neutral-400">• {product.category.name}</span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">{product.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Model: {product.model}
              {product.variant && ` • ${product.variant}`}
            </p>
          </div>

          {product.description && (
            <p className="text-sm text-neutral-600 leading-relaxed">{product.description}</p>
          )}

          {/* Best Current Deal */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-warning-500" />
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Best Current Deal</p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-neutral-900">{formatRupiah(Number(bestOffer.price))}</span>
              {product.reference_price && product.reference_price > bestOffer.price && (
                <>
                  <span className="text-base text-neutral-400 line-through">{formatRupiah(product.reference_price)}</span>
                  <span className="badge bg-error-500 text-white">-{discount}%</span>
                </>
              )}
            </div>

            {bestOffer.marketplace && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Marketplace</span>
                  <span className="font-medium text-neutral-900">{bestOffer.marketplace.name}</span>
                </div>
                {bestOffer.seller && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Seller</span>
                    <span className="font-medium text-neutral-900">{bestOffer.seller.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Rating</span>
                  <span className="font-medium text-neutral-900 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
                    {bestOffer.seller_rating.toFixed(1)} ({formatCompactNumber(bestOffer.review_count)} review)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Shipping</span>
                  <span className="font-medium text-neutral-900">
                    {Number(bestOffer.shipping_cost) === 0 ? 'Gratis' : formatRupiah(Number(bestOffer.shipping_cost))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Warranty</span>
                  <span className="font-medium text-neutral-900">{bestOffer.warranty || '-'}</span>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button onClick={() => handleBuyNow(bestOffer)} className="btn-primary flex-1">
                <ShoppingCart className="h-4 w-4" />
                Beli di {bestOffer.marketplace?.name}
              </button>
              <button onClick={handlePantauHarga} className="btn-secondary">
                <Bell className="h-4 w-4" />
                Pantau Harga
              </button>
              <button
                onClick={handleAddWishlist}
                className={`btn-secondary px-3 ${inWishlist ? 'text-error-600 border-error-200' : ''}`}
                title={inWishlist ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
              >
                {inWishlist ? '♥' : '♡'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BUY / WAIT / AVOID Decision */}
      {recommendation && bestOfferScore && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Rekomendasi DealFinder</h2>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex items-center gap-3 md:flex-col md:items-center md:w-48 shrink-0">
              <div className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-3 ${getStatusColor(recommendation.status)}`}>
                <span className={`h-3 w-3 rounded-full ${getStatusDot(recommendation.status)}`} />
                <span className="text-lg font-bold">{recommendation.title}</span>
              </div>
              <p className="text-sm text-neutral-600 md:text-center">{recommendation.message}</p>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Kenapa?</h3>
              <ul className="space-y-2">
                {recommendation.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary-500" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* DF Score */}
      {bestOfferScore && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 flex flex-col items-center justify-center">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">DF Score</h2>
            <DFScoreDisplay score={bestOfferScore} size="lg" />
            <p className="text-sm text-neutral-600 text-center mt-4 max-w-xs">
              {bestOfferScore.statusMessage}
            </p>
          </div>
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Komposisi Score</h2>
            <DFScoreBreakdown score={bestOfferScore} />
            <div className="mt-4 flex items-start gap-2 text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>DF Score dihitung secara deterministik berdasarkan harga, kualitas seller, review, warranty, shipping, dan faktor kepercayaan. Sponsored placement tidak memengaruhi DF Score.</p>
            </div>
          </div>
        </div>
      )}

      {/* Price Position Visual */}
      {historySummary && pricePosition !== null && (
        <div className="card p-6 mb-8">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Posisi Harga</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Harga saat ini dibandingkan range 30 hari terakhir.
          </p>
          <div className="relative pt-6 pb-2">
            <div className="h-2 bg-gradient-to-r from-success-300 via-warning-300 to-error-300 rounded-full" />
            <div
              className="absolute top-3 transform -translate-x-1/2"
              style={{ left: `${Math.max(0, Math.min(100, pricePosition))}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-primary-600 bg-white px-1.5 py-0.5 rounded shadow-sm border border-primary-200 mb-1">NOW</span>
                <div className="w-0.5 h-5 bg-primary-600" />
                <div className="h-3 w-3 rounded-full bg-primary-600 -mt-1 ring-2 ring-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
            <div>
              <p className="font-semibold text-success-600">TERENDAH</p>
              <p>{formatRupiah(historySummary.lowest)}</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-neutral-600">RATA-RATA</p>
              <p>{formatRupiah(historySummary.average)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-error-600">TERTINGGI</p>
              <p>{formatRupiah(historySummary.highest)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Price History */}
      {historySummary && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900">Riwayat Harga</h2>
            <div className="flex gap-1">
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setHistoryDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    historyDays === d ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {d} hari
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Harga Sekarang" value={formatRupiah(Number(bestOffer.price))} />
            <StatCard label="Harga Terendah" value={formatRupiah(historySummary.lowest)} color="text-success-600" />
            <StatCard label="Harga Tertinggi" value={formatRupiah(historySummary.highest)} color="text-error-600" />
            <StatCard label="Rata-rata" value={formatRupiah(historySummary.average)} />
          </div>

          {priceDiff !== null && (
            <div className="flex items-center gap-2 text-sm font-medium mb-4 bg-neutral-50 rounded-lg px-4 py-2.5">
              {priceDiff < 0 ? <TrendingDown className="h-4 w-4 text-success-600" /> : <TrendingUp className="h-4 w-4 text-error-600" />}
              <span className={priceDiff < 0 ? 'text-success-600' : 'text-error-600'}>
                Harga saat ini berada {Math.abs(priceDiff).toFixed(1)}% {priceDiff < 0 ? 'di bawah' : 'di atas'} rata-rata {historyDays} hari.
              </span>
            </div>
          )}

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historySummary.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  width={50}
                />
                <Tooltip
                  formatter={(v: number) => [formatRupiah(v), 'Harga']}
                  labelFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Marketplace Comparison */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">Bandingkan Harga</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="pb-3 font-semibold text-neutral-500">Marketplace</th>
                <th className="pb-3 font-semibold text-neutral-500">Seller</th>
                <th className="pb-3 font-semibold text-neutral-500">Harga</th>
                <th className="pb-3 font-semibold text-neutral-500 hidden sm:table-cell">Rating</th>
                <th className="pb-3 font-semibold text-neutral-500 hidden md:table-cell">Shipping</th>
                <th className="pb-3 font-semibold text-neutral-500 hidden lg:table-cell">Warranty</th>
                <th className="pb-3 font-semibold text-neutral-500">DF Score</th>
                <th className="pb-3 font-semibold text-neutral-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, idx) => {
                const score = calculateDealScore(offer, product.reference_price, null)
                const isBest = idx === 0
                return (
                  <tr key={offer.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-neutral-900">{offer.marketplace?.name}</span>
                        {isBest && (
                          <span className="badge bg-warning-100 text-warning-700 border border-warning-200 gap-0.5">
                            <Trophy className="h-3 w-3" />
                            BEST
                          </span>
                        )}
                        {offer.is_sponsored && (
                          <span className="badge bg-neutral-100 text-neutral-500">Sponsor</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-neutral-600">{offer.seller?.name || '-'}</td>
                    <td className="py-3">
                      <span className="font-semibold text-neutral-900">{formatRupiah(Number(offer.price))}</span>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-neutral-600">
                        <Star className="h-3 w-3 fill-warning-400 text-warning-400" />
                        {offer.seller_rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 hidden md:table-cell text-neutral-600">
                      {Number(offer.shipping_cost) === 0 ? 'Gratis' : formatRupiah(Number(offer.shipping_cost))}
                    </td>
                    <td className="py-3 hidden lg:table-cell text-neutral-600">{offer.warranty || '-'}</td>
                    <td className="py-3">
                      <span className={`badge border ${getStatusColor(score.status)}`}>{score.score}</span>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleBuyNow(offer)} className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap">
                        Beli di {offer.marketplace?.name}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Alert Modal */}
      {showAlertModal && bestOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setShowAlertModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-900">Pantau Harga</h3>
              <button onClick={() => { setShowAlertModal(false); setAlertSuccess(false) }} className="p-1 hover:bg-neutral-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {alertSuccess ? (
              <div className="py-4">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-success-100 text-success-600 mb-4">
                  <Bell className="h-7 w-7" />
                </div>
                <p className="text-center text-sm font-semibold text-neutral-900 mb-4">
                  Price Alert aktif.
                </p>
                <div className="space-y-2 text-sm bg-neutral-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Harga sekarang</span>
                    <span className="font-semibold text-neutral-900">{formatRupiah(Number(bestOffer.price))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Target</span>
                    <span className="font-semibold text-neutral-900">{formatRupiah(Number(targetPrice))}</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-2 flex items-center justify-between">
                    <span className="text-neutral-500">Masih</span>
                    <span className="font-semibold text-primary-600">
                      {formatRupiah(Number(bestOffer.price) - Number(targetPrice))}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowAlertModal(false); setAlertSuccess(false) }}
                  className="btn-primary w-full"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-neutral-600 mb-4">
                  Berapa harga target kamu untuk {product.name}?
                </p>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="17500000"
                    className="input pl-10"
                    autoFocus
                  />
                </div>
                {alertError && <p className="text-sm text-error-600 mb-3">{alertError}</p>}
                <div className="space-y-1 text-xs text-neutral-500 mb-4 bg-neutral-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span>Harga saat ini</span>
                    <span className="font-medium">{formatRupiah(Number(bestOffer.price))}</span>
                  </div>
                </div>
                <button onClick={handleSetAlert} className="btn-primary w-full">
                  <Bell className="h-4 w-4" />
                  Aktifkan Price Alert
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky Mobile Buy Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-neutral-200 p-3 flex gap-2">
        <button onClick={handlePantauHarga} className="btn-secondary px-3 shrink-0">
          <Bell className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleBuyNow(bestOffer)}
          className="btn-primary flex-1 text-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          Beli {formatRupiah(Number(bestOffer.price))}
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-3">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${color || 'text-neutral-900'}`}>{value}</p>
    </div>
  )
}
