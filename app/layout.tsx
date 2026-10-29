import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SIBAQ \'26 Aliyah Assessment Hub',
  description: 'Gamified AI-powered assessment platform for SIBAQ \'26 Kulliyyah candidates',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#F7F7F5' }}>
        {children}
      </body>
    </html>
  )
}
