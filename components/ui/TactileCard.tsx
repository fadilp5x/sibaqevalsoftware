import { ReactNode } from 'react'

const accentMap: Record<string, { border: string; borderBottom: string; text: string; bg: string }> = {
  emerald: { border: 'border-green-400', borderBottom: 'border-b-green-600', text: 'text-green-600', bg: 'bg-green-50' },
  sky: { border: 'border-sky-400', borderBottom: 'border-b-sky-600', text: 'text-sky-600', bg: 'bg-sky-50' },
  amber: { border: 'border-amber-400', borderBottom: 'border-b-amber-600', text: 'text-amber-600', bg: 'bg-amber-50' },
  purple: { border: 'border-purple-400', borderBottom: 'border-b-purple-600', text: 'text-purple-600', bg: 'bg-purple-50' },
  coral: { border: 'border-red-400', borderBottom: 'border-b-red-600', text: 'text-red-600', bg: 'bg-red-50' },
  default: { border: 'border-slate-300', borderBottom: 'border-b-slate-500', text: 'text-slate-600', bg: 'bg-slate-50' },
}

interface TactileCardProps {
  children: ReactNode
  accentColor?: string
  className?: string
  onClick?: () => void
  hover?: boolean
}

export default function TactileCard({ children, accentColor, className = '', onClick, hover = false }: TactileCardProps) {
  const accent = accentMap[accentColor || 'default']
  const hoverClass = hover ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border-2 ${accent.border} border-b-4 ${accent.borderBottom}
        p-5 shadow-sm transition-all duration-200
        ${hoverClass}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
