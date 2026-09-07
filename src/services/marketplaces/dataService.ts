import { supabase } from '../../lib/supabase'
import type { Product, Offer, PriceHistory, Category, Marketplace, PriceHistorySummary } from '../../types'

/**
 * Marketplace data service layer.
 * Currently uses Supabase database with mock data.
 * This abstraction allows real marketplace APIs (Shopee, Tokopedia, etc.)
 * to replace the data source without changing the frontend.
 */

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data as Category[]
}

export async function getMarketplaces(): Promise<Marketplace[]> {
  const { data, error } = await supabase.from('marketplaces').select('*').order('name')
  if (error) throw error
  return data as Marketplace[]
}

export async function getProducts(filters?: {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  marketplace?: string
  sortBy?: 'recommended' | 'lowest_price' | 'highest_score' | 'biggest_discount'
  limit?: number
}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('active', true)

  if (filters?.category) {
    query = query.eq('category.slug', filters.category)
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
    )
  }

  if (filters?.sortBy === 'lowest_price') {
    query = query.order('reference_price', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as Product | null
}

export async function getOffersByProduct(productId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*, marketplace:marketplaces(*), seller:sellers(*)')
    .eq('product_id', productId)
    .eq('active', true)
    .order('price', { ascending: true })
  if (error) throw error
  return data as Offer[]
}

export async function getBestOffer(productId: string): Promise<Offer | null> {
  const { data, error } = await supabase
    .from('offers')
    .select('*, marketplace:marketplaces(*), seller:sellers(*)')
    .eq('product_id', productId)
    .eq('active', true)
    .order('price', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as Offer | null
}

export async function getPriceHistory(
  offerId: string,
  days: number = 30
): Promise<PriceHistory[]> {
  const daysAgo = new Date()
  daysAgo.setDate(daysAgo.getDate() - days)
  
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('offer_id', offerId)
    .gte('recorded_at', daysAgo.toISOString())
    .order('recorded_at', { ascending: true })
  if (error) throw error
  return data as PriceHistory[]
}

export async function getPriceHistorySummary(
  offerId: string,
  days: number = 30
): Promise<PriceHistorySummary | null> {
  const history = await getPriceHistory(offerId, days)
  if (history.length === 0) return null

  const prices = history.map(h => Number(h.price))
  const lowest = Math.min(...prices)
  const highest = Math.max(...prices)
  const average = prices.reduce((sum, p) => sum + p, 0) / prices.length
  const current = prices[prices.length - 1]

  return {
    lowest,
    highest,
    average: Math.round(average),
    current,
    history: history.map(h => ({
      date: h.recorded_at,
      price: Number(h.price),
    })),
  }
}

export async function trackSearch(
  query: string,
  resultsCount: number,
  userId?: string
): Promise<void> {
  const { error } = await supabase.from('searches').insert({
    query,
    results_count: resultsCount,
    user_id: userId || null,
  })
  if (error) console.error('Failed to track search:', error)
}

export async function trackAffiliateClick(
  productId: string,
  offerId: string,
  marketplaceId: string,
  userId?: string
): Promise<void> {
  const { error } = await supabase.from('affiliate_clicks').insert({
    product_id: productId,
    offer_id: offerId,
    marketplace_id: marketplaceId,
    user_id: userId || null,
  })
  if (error) console.error('Failed to track affiliate click:', error)
}

export async function getPriceDropProducts(limit: number = 8): Promise<{
  product: Product
  bestOffer: Offer
  previousPrice: number
  dropPercent: number
  historyAverage: number
}[]> {
  const prods = await getProducts({ limit: 30 })
  const results: {
    product: Product
    bestOffer: Offer
    previousPrice: number
    dropPercent: number
    historyAverage: number
  }[] = []

  await Promise.all(
    prods.map(async (p) => {
      const offer = await getBestOffer(p.id)
      if (!offer) return
      const hist = await getPriceHistorySummary(offer.id, 30)
      if (!hist || hist.history.length < 2) return

      const previousPrice = hist.history[0].price
      const currentPrice = Number(offer.price)
      if (previousPrice <= currentPrice) return

      const dropPercent = ((previousPrice - currentPrice) / previousPrice) * 100
      if (dropPercent < 1) return

      results.push({
        product: p,
        bestOffer: offer,
        previousPrice,
        dropPercent,
        historyAverage: hist.average,
      })
    })
  )

  return results
    .sort((a, b) => b.dropPercent - a.dropPercent)
    .slice(0, limit)
}
