import { ImageResponse } from 'next/og'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          180,
          height:         180,
          borderRadius:   40,
          background:     'linear-gradient(135deg, #d4924e 0%, #a96530 100%)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'Georgia, serif',
          fontSize:        116,
          fontWeight:     700,
          color:          'white',
          letterSpacing:  '-2px',
        }}
      >
        L
      </div>
    ),
    { ...size },
  )
}
