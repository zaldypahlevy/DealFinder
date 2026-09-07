import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, TrendingDown, Sparkles, ArrowRight, Check, Flame } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard'
import { getProducts, getBestOffer, getPriceHistorySummary, getPriceDropProducts, trackSearch } from '../services/marketplaces/dataService'
import { calculateDealScore } from '../services/deal-engine/calculateDealScore'
import { formatRupiah, getDiscountPercent, getStatusColor, getScoreColor } from '../utils/format'
import type { Product, Offer } from '../types'

interface PriceDropItem {
  product: Product
  bestOffer: Offer
  previousPrice: number
  dropPercent: number
  historyAverage: number
}

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [bestOffers, setBestOffers] = useState<Record<string, Offer>>({})
  const [historyAverages, setHistoryAverages] = useState<Record<string, number>>({})
  const [priceDrops, setPriceDrops] = useState<PriceDropItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dropsLoading, setDropsLoading] = useState(true)

  useEffect(() => {
    loadDeals()
    loadPriceDrops()
  }, [])

  const loadDeals = async () => {
    try {
      const prods = await getProducts({ limit: 12 })
      setProducts(prods)

      const offerMap: Record<string, Offer> = {}
      const avgMap: Record<string, number> = {}
      await Promise.all(
        prods.map(async (p) => {
          const offer = await getBestOffer(p.id)
          if (offer) {
            offerMap[p.id] = offer
            const hist = await getPriceHistorySummary(offer.id, 30)
            if (hist) avgMap[p.id] = hist.average
          }
        })
      )
      setBestOffers(offerMap)
      setHistoryAverages(avgMap)
    } catch (err) {
      console.error('Failed to load deals:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPriceDrops = async () => {
    try {
      const drops = await getPriceDropProducts(8)
      setPriceDrops(drops)
    } catch (err) {
      console.error('Failed to load price drops:', err)
    } finally {
      setDropsLoading(false)
    }
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      trackSearch(query.trim(), 0)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const topDeals = products
    .filter((p) => bestOffers[p.id])
    .map((p) => ({
      product: p,
      offer: bestOffers[p.id],
      score: calculateDealScore(bestOffers[p.id], p.reference_price, null).score,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-neutral-50 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-600 mb-6 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-primary-500" />
            Shopping Intelligence Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 tracking-tight animate-slide-up">
            Cari sebelum beli.
          </h1>
          <p className="mt-4 text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto animate-slide-up">
            Jangan cuma cari harga termurah. Temukan deal terbaik.
          </p>
          <p className="mt-3 text-sm text-neutral-500 max-w-2xl mx-auto animate-slide-up">
            DealFinder membantu kamu mengetahui apakah harga sekarang benar-benar bagus, membandingkan marketplace, dan menentukan apakah sebaiknya beli sekarang atau menunggu.
          </p>

          <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto animate-slide-up">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Contoh: iPhone 17 Pro 256GB"
                  className="w-full rounded-2xl border border-neutral-200 bg-white pl-12 pr-4 py-4 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition"
                />
              </div>
              <button type="submit" className="btn-primary px-8 py-4 text-base">
                Cari Deal
              </button>
            </div>
            <div className="mt-3 flex justify-center gap-3">
              <Link to="/search" className="btn-secondary text-sm">
                Lihat Deal Hari Ini
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/ai" className="btn-secondary text-sm">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Bantu Saya Memilih
              </Link>
            </div>
          </form>

          {/* Helper questions */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto animate-slide-up">
            {[
              { icon: '💰', text: 'Berapa harga terbaik?' },
              { icon: '📉', text: 'Apakah harga sekarang sedang murah?' },
              { icon: '⏳', text: 'Sebaiknya beli sekarang atau tunggu?' },
              { icon: '🏆', text: 'Mana deal terbaik?' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-white/80 border border-neutral-100 px-4 py-2.5 text-left">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm text-neutral-600 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Deals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Deal Terbaik Hari Ini</h2>
            <p className="text-sm text-neutral-500 mt-1">Produk dengan DF Score tertinggi</p>
          </div>
          <Link to="/search" className="text-sm font-semibold text-primary-600 hover:text-primary-700 hidden sm:block">
            Lihat semua →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {topDeals.map(({ product, offer }, index) => (
              <ProductCard
                key={product.id}
                product={product}
                bestOffer={offer}
                referencePrice={product.reference_price}
                historyAverage={historyAverages[product.id]}
                isBestDeal={index === 0}
                showLihatDeal
              />
            ))}
          </div>
        )}
      </section>

      {/* Price Drop Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-error-500" />
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Harga Turun Hari Ini</h2>
              <p className="text-sm text-neutral-500 mt-1">Produk dengan penurunan harga terbesar</p>
            </div>
          </div>
        </div>

        {dropsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : priceDrops.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-neutral-400">Belum ada produk dengan harga turun hari ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {priceDrops.map((item) => {
              const dealScore = calculateDealScore(item.bestOffer, item.product.reference_price, null)
              const discount = getDiscountPercent(Number(item.bestOffer.price), item.previousPrice)
              return (
                <Link
                  key={item.product.id}
                  to={`/product/${item.product.id}`}
                  className="card p-4 flex flex-col gap-3 hover:shadow-md hover:border-neutral-300 transition-all duration-200 group"
                >
                  <div className="relative aspect-square rounded-xl bg-neutral-100 overflow-hidden">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-neutral-300">
                        <span className="text-4xl font-bold">{item.product.brand.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 badge bg-success-500 text-white">
                      <TrendingDown className="h-3 w-3" />
                      -{discount}%
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 font-medium">{item.product.brand}</p>
                    <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">{item.product.name}</h3>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-lg font-bold text-neutral-900">{formatRupiah(Number(item.bestOffer.price))}</span>
                    <p className="text-xs text-neutral-400 line-through">{formatRupiah(item.previousPrice)}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${getStatusColor(dealScore.status)}`}>
                        <span className="text-xs font-bold">DF {dealScore.score}</span>
                      </div>
                      <span className={`text-xs font-semibold ${getScoreColor(dealScore.score)}`}>
                        {dealScore.status === 'BUY' && '🔥 '}
                        {dealScore.statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 rounded-xl bg-primary-50 text-primary-700 py-2 text-xs font-semibold group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      Lihat Deal
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Trust & Transparency */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900">Kenapa DealFinder?</h2>
          <p className="text-sm text-neutral-500 mt-2">Karena harga murah belum tentu deal terbaik.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            'Bandingkan harga antar marketplace',
            'Lihat riwayat harga 30 hari',
            'Nilai kualitas seller dan review',
            'Dapatkan rekomendasi BUY / WAIT / AVOID',
            'Pantau harga yang kamu inginkan',
            'Sponsored tidak memengaruhi DF Score',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 card p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 text-success-600 shrink-0">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm text-neutral-700 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
