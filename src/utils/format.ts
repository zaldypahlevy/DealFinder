export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num)
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'jt'
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'rb'
  return num.toString()
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function getDiscountPercent(current: number, reference: number | null): number {
  if (!reference || reference <= 0) return 0
  return Math.round(((reference - current) / reference) * 100)
}

export function getStatusColor(status: 'BUY' | 'WAIT' | 'AVOID'): string {
  switch (status) {
    case 'BUY': return 'bg-success-100 text-success-700 border-success-200'
    case 'WAIT': return 'bg-warning-100 text-warning-700 border-warning-200'
    case 'AVOID': return 'bg-error-100 text-error-700 border-error-200'
  }
}

export function getStatusDot(status: 'BUY' | 'WAIT' | 'AVOID'): string {
  switch (status) {
    case 'BUY': return 'bg-success-500'
    case 'WAIT': return 'bg-warning-500'
    case 'AVOID': return 'bg-error-500'
  }
}

export const SCORE_THRESHOLDS = {
  buy: 80,
  wait: 60,
}

export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.buy) return 'text-success-600'
  if (score >= SCORE_THRESHOLDS.wait) return 'text-warning-600'
  return 'text-error-600'
}

export function getScoreBg(score: number): string {
  if (score >= SCORE_THRESHOLDS.buy) return 'bg-success-50 border-success-200'
  if (score >= SCORE_THRESHOLDS.wait) return 'bg-warning-50 border-warning-200'
  return 'bg-error-50 border-error-200'
}

export function getScoreRingColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.buy) return 'text-success-500'
  if (score >= SCORE_THRESHOLDS.wait) return 'text-warning-500'
  return 'text-error-500'
}
