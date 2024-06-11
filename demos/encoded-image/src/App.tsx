import type { FunctionComponent } from 'react'
import { useState } from 'react'

const imageDataPromise = fetch('/png-test.png').then((resp) => resp.arrayBuffer())

export const App: FunctionComponent = () => {
  const [imageBytes, setImageBytes] = useState<ArrayBuffer | null>(null)
  imageDataPromise.then((imageData) => setImageBytes(imageData))

  return imageBytes ? (
    <ck-canvas clear={{ red: 255, green: 165, blue: 0 }}>
      <ck-encoded-image top={10} left={10} bytes={imageBytes} />
    </ck-canvas>
  ) : null
}
