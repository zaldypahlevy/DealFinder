import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, Search as SearchIcon } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard'
import {
  getProducts,
  getOffersByProduct,
  getPriceHistorySummary,
  getCategories,
  getMarketplaces,
  trackSearch,
} from '../services/marketplaces/dataService'
import { calculateDealScore } from '../services/deal-engine/calculateDealScore'
import { useAuth } from '../hooks/useAuth'
import type { Product, Offer, Category, Marketplace } from '../types'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const query = searchParams.get('q') || ''
  const [products, setProducts] = useState<Product[]>([])
  const [bestOffers, setBestOffers] = useState<Record<string, Offer>>({})
  const [historyAverages, setHistoryAverages] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'recommended' | 'lowest_price' | 'highest_score' | 'biggest_discount'>('recommended')
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    marketplace: '',
  })

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getMarketplaces().then(setMarketplaces).catch(() => {})
  }, [])

  useEffect(() => {
    search()
  }, [query, sortBy, filters.category, filters.minPrice, filters.maxPrice])

  const search = async () => {
    setLoading(true)
    try {
      const prods = await getProducts({
        search: query || undefined,
        category: filters.category || undefined,
        sortBy: sortBy === 'highest_score' || sortBy === 'biggest_discount' ? 'recommended' : sortBy,
      })

      let filtered = prods
      if (filters.minPrice) filtered = filtered.filter((p) => p.reference_price && Number(p.reference_price) >= Number(filters.minPrice))
      if (filters.maxPrice) filtered = filtered.filter((p) => p.reference_price && Number(p.reference_price) <= Number(filters.maxPrice))

      const offerMap: Record<string, Offer> = {}
      const avgMap: Record<string, number> = {}

      await Promise.all(
        filtered.map(async (p) => {
          const offers = await getOffersByProduct(p.id)
          if (offers.length > 0) {
            offerMap[p.id] = offers[0]
            const hist = await getPriceHistorySummary(offers[0].id, 30)
            if (hist) avgMap[p.id] = hist.average
          }
        })
      )

      if (sortBy === 'highest_score') {
        filtered.sort((a, b) => {
          const sa = offerMap[a.id] ? calculateDealScore(offerMap[a.id], a.reference_price, null).score : 0
          const sb = offerMap[b.id] ? calculateDealScore(offerMap[b.id], b.reference_price, null).score : 0
          return sb - sa
        })
      } else if (sortBy === 'biggest_discount') {
        filtered.sort((a, b) => {
          const da = a.reference_price && offerMap[a.id] ? ((a.reference_price - Number(offerMap[a.id].price)) / a.reference_price) * 100 : 0
          const db = b.reference_price && offerMap[b.id] ? ((b.reference_price - Number(offerMap[b.id].price)) / b.reference_price) * 100 : 0
          return db - da
        })
      }

      setProducts(filtered)
      setBestOffers(offerMap)
      setHistoryAverages(avgMap)

      if (query) trackSearch(query, filtered.length, user?.id)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', marketplace: '' })
  }

  const hasResults = products.length > 0

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        {query ? (
          <h1 className="text-2xl font-bold text-neutral-900">
            Hasil untuk "{query}"
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-neutral-900">Cari Produk</h1>
        )}
        <p className="text-sm text-neutral-500 mt-1">
          {loading ? 'Mencari...' : `${products.length} produk ditemukan`}
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary text-sm lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="input max-w-xs text-sm py-2.5"
        >
          <option value="recommended">Rekomendasi</option>
          <option value="lowest_price">Harga Terendah</option>
          <option value="highest_score">DF Score Tertinggi</option>
          <option value="biggest_discount">Diskon Terbesar</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-200 p-4 overflow-y-auto transition-transform lg:static lg:translate-x-0 lg:w-64 lg:border-r-0 lg:bg-transparent lg:p-0 ${
          showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h3 className="font-semibold">Filter</h3>
            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 lg:card lg:p-5">
            <div>
              <label className="text-sm font-semibold text-neutral-700 block mb-2">Kategori</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="input text-sm py-2"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700 block mb-2">Range Harga</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="input text-sm py-2"
                />
                <span className="text-neutral-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="input text-sm py-2"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700 block mb-2">Marketplace</label>
              <select
                value={filters.marketplace}
                onChange={(e) => updateFilter('marketplace', e.target.value)}
                className="input text-sm py-2"
              >
                <option value="">Semua Marketplace</option>
                {marketplaces.map((m) => (
                  <option key={m.id} value={m.slug}>{m.name}</option>
                ))}
              </select>
            </div>

            <button onClick={clearFilters} className="btn-secondary w-full text-sm">
              Reset Filter
            </button>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : hasResults ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  bestOffer={bestOffers[p.id]}
                  referencePrice={p.reference_price}
                  historyAverage={historyAverages[p.id]}
                />
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
                <SearchIcon className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Produk belum ditemukan</h3>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                Coba gunakan nama produk atau model yang lebih spesifik.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
