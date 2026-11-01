import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#1E2538',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'SST — SHIA SIBAQ Training App',
  description: 'SHIA SIBAQ Training App — Champion-level AI training and campus assessment hub',
  applicationName: 'SST',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SST',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#FAF9F6' }}>
        {children}
      </body>
    </html>
  )
}
