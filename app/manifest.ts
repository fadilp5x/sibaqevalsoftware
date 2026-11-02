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
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
