import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SHIA SIBAQ Training App',
    short_name: 'SST',
    description: 'High-performance AI coaching & campus readiness hub for SHIA SIBAQ candidates',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F7F7',
    theme_color: '#58CC02',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
