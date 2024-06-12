import type { FunctionComponent } from 'react'
import React, { useEffect } from 'react'
import { TypeFace } from 'react-canvaskit'

const robotoPromise = fetch('https://storage.googleapis.com/skia-cdn/google-web-fonts/Roboto-Regular.ttf').then(
  (resp) => resp.arrayBuffer(),
)
const notoSansMonoPromise = fetch(
  'https://storage.googleapis.com/skia-cdn/google-web-fonts/NotoSansMono-Regular.ttf',
).then((resp) => resp.arrayBuffer())

export const App: FunctionComponent = () => {
  const [robotoTypeface, setRobotoTypeface] = React.useState<TypeFace | undefined>(undefined)
  const [notoSansMonoTypeface, setNotoSansMonoTypeface] = React.useState<TypeFace | undefined>(undefined)

  useEffect(() => {
    async function fetchFonts() {
      setRobotoTypeface({ data: await robotoPromise })
      setNotoSansMonoTypeface({ data: await notoSansMonoPromise })
    }
    fetchFonts()
  }, [])

  return (
    <ck-canvas clear={{ red: 255, green: 165, blue: 0 }}>
      <ck-text
        x={5}
        y={50}
        paint={{ color: '#00FFFF', antiAlias: true }}
        font={{ size: 24, typeFace: notoSansMonoTypeface }}
      >
        Hello React-CanvasKit!
      </ck-text>
      <ck-surface width={100} height={100} dx={100} dy={100}>
        <ck-canvas clear="#FF00FF" rotate={{ degree: 45 }}>
          <ck-text font={{ size: 14, typeFace: robotoTypeface }}> React-CanvasKit.</ck-text>
          <ck-line x1={0} y1={10} x2={142} y2={10} paint={{ antiAlias: true, color: '#FFFFFF', strokeWidth: 10 }} />
        </ck-canvas>
      </ck-surface>
    </ck-canvas>
  )
}
