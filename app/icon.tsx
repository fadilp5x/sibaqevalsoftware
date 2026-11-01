import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 192,
  height: 192,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 72,
          background: '#1E2538',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 44,
          border: '4px solid #FF6B4A',
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontWeight: 900,
            letterSpacing: -2,
            fontFamily: 'sans-serif',
          }}
        >
          SST
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
