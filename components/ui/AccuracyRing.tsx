const colorMap: Record<string, string> = {
  emerald: '#58CC02',
  sky: '#1CB0F6',
  amber: '#FFC800',
  coral: '#FF4B4B',
  purple: '#CE82FF',
  rose: '#FF4B4B',
}

interface AccuracyRingProps {
  pct: number
  accentColor: string
  size?: number
  strokeWidth?: number
}

export default function AccuracyRing({ pct, accentColor, size = 48, strokeWidth = 5 }: AccuracyRingProps) {
  const color = colorMap[accentColor] || '#1CB0F6'
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {/* Percentage text — rotate back */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#334155"
        fontSize={size * 0.26}
        fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}
      >
        {pct}%
      </text>
    </svg>
  )
}
