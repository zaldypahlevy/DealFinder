export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface Marketplace {
  id: string
  name: string
  slug: string
  color: string | null
  logo_url: string | null
}

export interface Seller {
  id: string
  marketplace_id: string
  name: string
  rating: number
  review_count: number
  is_official: boolean
}

export interface Product {
  id: string
  name: string
  brand: string
  model: string
  variant: string | null
  category_id: string | null
  description: string | null
  image_url: string | null
  reference_price: number | null
  active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Offer {
  id: string
  product_id: string
  marketplace_id: string
  seller_id: string | null
  price: number
  shipping_cost: number
  seller_rating: number
  review_count: number
  warranty: string | null
  return_policy: string | null
  product_url: string | null
  affiliate_url: string | null
  is_sponsored: boolean
  active: boolean
  created_at: string
  updated_at: string
  marketplace?: Marketplace
  seller?: Seller
}

export interface PriceHistory {
  id: string
  offer_id: string
  price: number
  recorded_at: string
}

export interface Wishlist {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

export interface PriceAlert {
  id: string
  user_id: string
  product_id: string
  target_price: number
  active: boolean
  triggered_at: string | null
  created_at: string
  product?: Product
}

export interface SearchRecord {
  id: string
  user_id: string | null
  query: string
  normalized_query: string | null
  results_count: number
  created_at: string
}

export interface AffiliateClick {
  id: string
  user_id: string | null
  product_id: string
  offer_id: string
  marketplace_id: string | null
  clicked_at: string
}

export interface DealScore {
  score: number
  status: 'BUY' | 'WAIT' | 'AVOID'
  statusLabel: string
  statusMessage: string
  components: {
    price: number
    seller: number
    reviews: number
    warranty: number
    shipping: number
    trust: number
  }
}

export interface DealRecommendation {
  status: 'BUY' | 'WAIT' | 'AVOID'
  title: 'BUY' | 'WAIT' | 'AVOID'
  message: string
  reasons: string[]
}

export interface PriceStatistics {
  currentPrice: number
  lowestPrice: number
  highestPrice: number
  averagePrice: number
  priceChangePercent: number
}

export interface ProductWithDetails extends Product {
  category?: Category
  best_offer?: Offer
  offers?: Offer[]
  deal_score?: DealScore
  price_history?: PriceHistorySummary
}

export interface PriceHistorySummary {
  lowest: number
  highest: number
  average: number
  current: number
  history: { date: string; price: number }[]
}
