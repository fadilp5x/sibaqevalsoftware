'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

type AccentColor = 'emerald' | 'sky' | 'amber' | 'coral' | 'purple' | 'slate'
type Size = 'sm' | 'md' | 'lg' | 'xl'

const accentMap: Record<AccentColor, string> = {
  emerald: 'bg-[#58CC02] border-[#46A302] text-white hover:bg-[#4db301]',
  sky: 'bg-[#1CB0F6] border-[#1899D6] text-white hover:bg-[#14a3e8]',
  amber: 'bg-[#FFC800] border-[#E5B400] text-slate-800 hover:bg-[#f0bc00]',
  coral: 'bg-[#FF4B4B] border-[#EA2B2B] text-white hover:bg-[#f03e3e]',
  purple: 'bg-[#CE82FF] border-[#b56de6] text-white hover:bg-[#c070f5]',
  slate: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
}

const sizeMap: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
  xl: 'px-10 py-4 text-xl',
}

interface TactileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  accentColor?: AccentColor
  size?: Size
  fullWidth?: boolean
}

export default function TactileButton({
  children,
  accentColor = 'emerald',
  size = 'md',
  fullWidth = false,
  className = '',
  ...rest
}: TactileButtonProps) {
  return (
    <button
      {...rest}
      className={`
        ${accentMap[accentColor]}
        ${sizeMap[size]}
        ${fullWidth ? 'w-full' : ''}
        font-bold rounded-xl
        border-2 border-b-4
        active:border-b-2 active:translate-y-[2px]
        transition-all duration-100
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-4
        inline-flex items-center justify-center gap-2
        select-none
        ${className}
      `}
    >
      {children}
    </button>
  )
}
