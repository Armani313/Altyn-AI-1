import { ImageResponse } from 'next/og'

export const size        = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          32,
          height:         32,
          borderRadius:   8,
          background:     'linear-gradient(135deg, #d4924e 0%, #a96530 100%)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'Georgia, serif',
          fontSize:        20,
          fontWeight:     700,
          color:          'white',
          letterSpacing:  '-0.5px',
        }}
      >
        L
      </div>
    ),
    { ...size },
  )
}
