import { init, render } from 'react-canvaskit'

import App from './App.tsx'

const htmlCanvasElement = document.createElement('canvas')
const rootElement = document.querySelector('#root')
if (!rootElement) {
  throw new Error('No root element defined.')
}
rootElement.appendChild(htmlCanvasElement)
htmlCanvasElement.width = 800
htmlCanvasElement.height = 600

await init()
await render(<App />, htmlCanvasElement)
