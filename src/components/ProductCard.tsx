import { Link } from 'react-router-dom'
import { TrendingDown, TrendingUp, Minus, Trophy, ArrowRight } from 'lucide-react'
import type { Product, Offer } from '../types'
import { calculateDealScore, DEAL_THRESHOLDS } from '../services/deal-engine/calculateDealScore'
import { formatRupiah, getDiscountPercent, getStatusColor, getScoreColor } from '../utils/format'

interface ProductCardProps {
  product: Product
  bestOffer?: Offer
  referencePrice?: number | null
  historyAverage?: number | null
  isBestDeal?: boolean
  showLihatDeal?: boolean
}

export function ProductCard({ product, bestOffer, referencePrice, historyAverage, isBestDeal, showLihatDeal }: ProductCardProps) {
  if (!bestOffer) {
    return (
      <div className="card p-4 flex flex-col gap-3">
        <div className="aspect-square rounded-xl bg-neutral-100 animate-pulse" />
        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
        <div className="h-8 bg-neutral-100 rounded animate-pulse" />
      </div>
    )
  }

  const dealScore = calculateDealScore(bestOffer, referencePrice ?? product.reference_price, null)
  const discount = getDiscountPercent(Number(bestOffer.price), referencePrice ?? product.reference_price)
  const priceTrend = historyAverage
    ? ((Number(bestOffer.price) - historyAverage) / historyAverage) * 100
    : null

  return (
    <Link to={`/product/${product.id}`} className="card p-4 flex flex-col gap-3 hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
      <div className="relative aspect-square rounded-xl bg-neutral-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-neutral-300">
            <span className="text-4xl font-bold">{product.brand.charAt(0)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-2 left-2 badge bg-error-500 text-white">
            -{discount}%
          </div>
        )}
        {isBestDeal && (
          <div className="absolute top-2 right-2 badge bg-warning-400 text-neutral-900 gap-0.5">
            <Trophy className="h-3 w-3" />
            BEST DEAL
          </div>
        )}
      </div>

      <div className="flex-1">
        <p className="text-xs text-neutral-500 font-medium">{product.brand}</p>
        <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">
          {product.name}
        </h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-neutral-900">
            {formatRupiah(Number(bestOffer.price))}
          </span>
        </div>
        {referencePrice && referencePrice > bestOffer.price && (
          <p className="text-xs text-neutral-400 line-through">
            {formatRupiah(referencePrice)}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${getStatusColor(dealScore.status)}`}>
            <span className="text-xs font-bold">DF {dealScore.score}</span>
          </div>
          <span className={`text-xs font-semibold ${getScoreColor(dealScore.score)}`}>
            {dealScore.status === 'BUY' && '🔥 '}
            {dealScore.statusLabel}
          </span>
        </div>

        {bestOffer.marketplace && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-neutral-500">{bestOffer.marketplace.name}</span>
            {priceTrend !== null && (
              <span className={`text-xs flex items-center gap-0.5 ${
                priceTrend < 0 ? 'text-success-600' : priceTrend > 0 ? 'text-error-600' : 'text-neutral-400'
              }`}>
                {priceTrend < 0 ? <TrendingDown className="h-3 w-3" /> :
                 priceTrend > 0 ? <TrendingUp className="h-3 w-3" /> :
                 <Minus className="h-3 w-3" />}
                {Math.abs(priceTrend).toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {showLihatDeal && (
          <div className="flex items-center justify-center gap-1 rounded-xl bg-primary-50 text-primary-700 py-2 text-xs font-semibold mt-1 group-hover:bg-primary-600 group-hover:text-white transition-colors">
            Lihat Deal
            <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="aspect-square rounded-xl skeleton" />
      <div className="h-3 w-1/3 skeleton rounded" />
      <div className="h-4 w-full skeleton rounded" />
      <div className="h-8 w-2/3 skeleton rounded" />
      <div className="h-6 w-full skeleton rounded" />
    </div>
  )
}

export { DEAL_THRESHOLDS }
