import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const revalidate = 86400
export const alt = 'Young Artist Community'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #C45D3E 0%, #A34A30 50%, #8B3D28 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Tuning fork icon with resonance arcs */}
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.2)" />
          <path d="M13 4 L13 17 Q13 21 16 21 Q19 21 19 17 L19 4" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M16 21 L16 28" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="16" cy="28.5" r="1.5" fill="white" />
          <path d="M9.5 5.5 Q8 12 10.5 15" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.35" />
          <path d="M22.5 5.5 Q24 12 21.5 15" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.35" />
        </svg>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: 32,
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.1,
              textAlign: 'center',
            }}
          >
            Young Artist Community
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 16,
              textAlign: 'center',
              maxWidth: 700,
            }}
          >
            Browse, compare, and review classical music programs
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 48,
          }}
        >
          {['Opera', 'Orchestral', 'Chamber Music', 'Art Song'].map((cat) => (
            <div
              key={cat}
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                background: '#d8ccef',
                color: '#4a3078',
                fontSize: 24,
                fontWeight: 500,
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 24,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          youngartist.community
        </div>
      </div>
    ),
    { ...size },
  )
}
