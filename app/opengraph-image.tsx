import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Nurai AI Studio — ИИ-фотографии украшений'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FAF7F4 0%, #F0E8E0 100%)',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Decorative circle top-right */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(196, 131, 79, 0.12)',
          }}
        />
        {/* Decorative circle bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(196, 131, 79, 0.08)',
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #C4834F 0%, #A0612A 100%)',
            marginBottom: 28,
            boxShadow: '0 8px 32px rgba(196, 131, 79, 0.4)',
          }}
        >
          <span style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>N</span>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 22,
            color: '#C4834F',
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 20,
            fontFamily: 'Georgia, serif',
          }}
        >
          Nurai AI Studio
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            color: '#1a1a1a',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: 880,
            marginBottom: 20,
          }}
        >
          ИИ-фотографии украшений
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: '#6b5c4e',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 40,
            fontFamily: 'sans-serif',
          }}
        >
          Профессиональный лайфстайл-контент без фотографа
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(196, 131, 79, 0.12)',
            border: '1.5px solid rgba(196, 131, 79, 0.35)',
            borderRadius: 100,
            padding: '10px 24px',
          }}
        >
          <span style={{ fontSize: 18, color: '#C4834F', fontFamily: 'sans-serif' }}>
            ✦ Для ювелирных магазинов Казахстана
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
