import type { Offer, PriceHistorySummary, DealScore, DealRecommendation, PriceStatistics } from '../../types'

export const DEAL_SCORE_WEIGHTS = {
  price: 0.40,
  seller: 0.20,
  reviews: 0.15,
  warranty: 0.10,
  shipping: 0.10,
  trust: 0.05,
}

export const DEAL_THRESHOLDS = {
  buy: 80,
  wait: 60,
}

export function calculatePriceScore(
  currentPrice: number,
  referencePrice: number | null,
  historySummary: PriceHistorySummary | null
): number {
  if (!referencePrice || referencePrice <= 0) return 50

  const discountPercent = (referencePrice - currentPrice) / referencePrice
  const score = 50 + discountPercent * 200

  if (historySummary) {
    if (currentPrice <= historySummary.lowest * 1.02) {
      return Math.min(100, score + 15)
    }
    if (currentPrice < historySummary.average) {
      const belowAvgBonus = ((historySummary.average - currentPrice) / historySummary.average) * 100
      return Math.min(100, score + belowAvgBonus)
    }
    if (currentPrice > historySummary.average * 1.05) {
      return Math.max(0, score - 15)
    }
  }

  return Math.max(0, Math.min(100, score))
}

export function calculateSellerScore(rating: number): number {
  if (rating >= 5.0) return 100
  if (rating >= 4.8) return 90
  if (rating >= 4.5) return 75
  if (rating >= 4.0) return 55
  if (rating >= 3.5) return 30
  return 10
}

export function calculateReviewScore(reviewCount: number): number {
  if (reviewCount >= 50000) return 100
  if (reviewCount >= 20000) return 85
  if (reviewCount >= 5000) return 70
  if (reviewCount >= 1000) return 55
  if (reviewCount >= 100) return 40
  if (reviewCount > 0) return 25
  return 0
}

export function calculateWarrantyScore(warranty: string | null): number {
  if (!warranty) return 0
  const w = warranty.toLowerCase()
  if (w.includes('apple') || w.includes('official') || w.includes('resmi')) return 100
  if (w.includes('1 tahun') || w.includes('1 year') || w.includes('12 bulan')) return 80
  if (w.includes('6 bulan') || w.includes('6 month')) return 50
  if (w.includes('3 bulan') || w.includes('3 month')) return 30
  if (w.includes('garansi')) return 60
  return 40
}

export function calculateShippingScore(shippingCost: number): number {
  if (shippingCost === 0) return 100
  if (shippingCost <= 10000) return 70
  if (shippingCost <= 30000) return 40
  if (shippingCost <= 50000) return 20
  return 0
}

export function calculateTrustScore(
  warranty: string | null,
  returnPolicy: string | null,
  isOfficial: boolean | undefined,
  _isSponsored: boolean
): number {
  let score = 30
  if (warranty) score += 20
  if (returnPolicy) score += 20
  if (isOfficial) score += 30
  return Math.min(100, score)
}

export function getDealStatusLabel(score: number): string {
  if (score >= DEAL_THRESHOLDS.buy) return 'DEAL BAGUS'
  if (score >= DEAL_THRESHOLDS.wait) return 'CUKUP MENARIK'
  return 'KURANG MENARIK'
}

export function calculateDealScore(
  offer: Offer,
  referencePrice: number | null,
  historySummary: PriceHistorySummary | null
): DealScore {
  const priceScore = calculatePriceScore(offer.price, referencePrice, historySummary)
  const sellerScore = calculateSellerScore(offer.seller_rating)
  const reviewScore = calculateReviewScore(offer.review_count)
  const warrantyScore = calculateWarrantyScore(offer.warranty)
  const shippingScore = calculateShippingScore(Number(offer.shipping_cost))
  const trustScore = calculateTrustScore(offer.warranty, offer.return_policy, offer.seller?.is_official, offer.is_sponsored)

  const totalScore = Math.round(
    priceScore * DEAL_SCORE_WEIGHTS.price +
    sellerScore * DEAL_SCORE_WEIGHTS.seller +
    reviewScore * DEAL_SCORE_WEIGHTS.reviews +
    warrantyScore * DEAL_SCORE_WEIGHTS.warranty +
    shippingScore * DEAL_SCORE_WEIGHTS.shipping +
    trustScore * DEAL_SCORE_WEIGHTS.trust
  )

  const score = Math.max(0, Math.min(100, totalScore))

  let status: 'BUY' | 'WAIT' | 'AVOID'
  let statusMessage: string

  if (score >= DEAL_THRESHOLDS.buy) {
    status = 'BUY'
    statusMessage = 'Ini waktu yang cukup baik untuk membeli.'
  } else if (score >= DEAL_THRESHOLDS.wait) {
    status = 'WAIT'
    statusMessage = 'Kalau tidak terburu-buru, menunggu bisa menjadi pilihan.'
  } else {
    status = 'AVOID'
    statusMessage = 'Deal ini belum cukup menarik.'
  }

  return {
    score,
    status,
    statusLabel: getDealStatusLabel(score),
    statusMessage,
    components: {
      price: Math.round(priceScore),
      seller: Math.round(sellerScore),
      reviews: Math.round(reviewScore),
      warranty: Math.round(warrantyScore),
      shipping: Math.round(shippingScore),
      trust: Math.round(trustScore),
    },
  }
}

export function getDealRecommendation(
  score: DealScore,
  historySummary: PriceHistorySummary | null
): DealRecommendation {
  if (!historySummary) {
    return {
      status: score.status,
      title: score.status,
      message: score.statusMessage,
      reasons: ['DF Score berdasarkan harga, seller, dan faktor kepercayaan.'],
    }
  }

  const { current, average, lowest, highest } = historySummary
  const diffFromAvg = ((current - average) / average) * 100
  const isNearLowest = current <= lowest * 1.03
  const isNearHighest = current >= highest * 0.97
  const reasons: string[] = []

  if (score.status === 'BUY') {
    if (isNearLowest) {
      reasons.push(`Harga saat ini merupakan salah satu harga terendah dalam periode tersebut.`)
    }
    if (diffFromAvg < 0) {
      reasons.push(`Harga saat ini ${Math.abs(diffFromAvg).toFixed(1)}% di bawah rata-rata 30 hari.`)
    }
    reasons.push(`DF Score ${score.score}/100 menunjukkan deal yang baik.`)
  } else if (score.status === 'WAIT') {
    if (diffFromAvg > 0) {
      reasons.push(`Harga saat ini ${diffFromAvg.toFixed(1)}% di atas rata-rata 30 hari.`)
    }
    if (!isNearLowest) {
      reasons.push(`Harga masih bisa turun menuju ${formatRupiahShort(lowest)} (terendah 30 hari).`)
    }
    reasons.push(`DF Score ${score.score}/100 — menunggu bisa memberikan deal yang lebih baik.`)
  } else {
    if (isNearHighest) {
      reasons.push(`Harga saat ini berada di dekat harga tertinggi 30 hari.`)
    }
    if (diffFromAvg > 0) {
      reasons.push(`Harga saat ini ${diffFromAvg.toFixed(1)}% di atas rata-rata 30 hari.`)
    }
    reasons.push(`DF Score ${score.score}/100 — deal ini belum cukup menarik.`)
  }

  return {
    status: score.status,
    title: score.status,
    message: score.statusMessage,
    reasons,
  }
}

function formatRupiahShort(amount: number): string {
  if (amount >= 1000000) return `Rp${(amount / 1000000).toFixed(1)}jt`
  if (amount >= 1000) return `Rp${(amount / 1000).toFixed(0)}rb`
  return `Rp${amount}`
}

export function getPriceStatistics(
  bestPrice: number,
  historySummary: PriceHistorySummary | null
): PriceStatistics | null {
  if (!historySummary) return null

  const priceChangePercent = ((bestPrice - historySummary.average) / historySummary.average) * 100

  return {
    currentPrice: bestPrice,
    lowestPrice: historySummary.lowest,
    highestPrice: historySummary.highest,
    averagePrice: historySummary.average,
    priceChangePercent,
  }
}
