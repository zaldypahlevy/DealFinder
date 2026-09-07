import type { DealScore as DealScoreType } from '../types'
import { getStatusColor, getScoreBg, getScoreRingColor, SCORE_THRESHOLDS } from '../utils/format'

interface DFScoreDisplayProps {
  score: DealScoreType
  size?: 'sm' | 'md' | 'lg'
}

export function DFScoreDisplay({ score, size = 'md' }: DFScoreDisplayProps) {
  const sizes = {
    sm: { ring: 'h-20 w-20', text: 'text-2xl', label: 'text-xs' },
    md: { ring: 'h-28 w-28', text: 'text-3xl', label: 'text-sm' },
    lg: { ring: 'h-36 w-36', text: 'text-5xl', label: 'text-base' },
  }
  const s = sizes[size]

  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference - (score.score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${s.ring}`}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-200"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={getScoreRingColor(score.score)}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-neutral-900 ${s.text}`}>{score.score}</span>
          <span className={`text-neutral-400 ${s.label}`}>/ 100</span>
        </div>
      </div>
      <div className={`badge border ${getStatusColor(score.status)} ${s.label}`}>
        {score.status === 'BUY' ? '🟢 ' : score.status === 'AVOID' ? '🔴 ' : '🟡 '}
        {score.statusLabel}
      </div>
    </div>
  )
}

export function DFScoreBreakdown({ score }: { score: DealScoreType }) {
  const components = [
    { label: 'Harga', value: score.components.price, weight: '40%' },
    { label: 'Seller', value: score.components.seller, weight: '20%' },
    { label: 'Review', value: score.components.reviews, weight: '15%' },
    { label: 'Garansi', value: score.components.warranty, weight: '10%' },
    { label: 'Shipping', value: score.components.shipping, weight: '10%' },
    { label: 'Trust', value: score.components.trust, weight: '5%' },
  ]

  return (
    <div className={`rounded-xl border p-4 ${getScoreBg(score.score)}`}>
      <p className="text-sm font-semibold text-neutral-700 mb-3">Kenapa skor ini?</p>
      <div className="space-y-2.5">
        {components.map((c) => (
          <div key={c.label} className="flex items-center gap-3">
            <span className="text-xs text-neutral-600 w-16 shrink-0">{c.label}</span>
            <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${c.value}%`,
                  backgroundColor: c.value >= SCORE_THRESHOLDS.buy ? '#16b364' : c.value >= SCORE_THRESHOLDS.wait ? '#eab308' : '#ef4444',
                }}
              />
            </div>
            <span className="text-xs font-medium text-neutral-700 w-8 text-right">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
