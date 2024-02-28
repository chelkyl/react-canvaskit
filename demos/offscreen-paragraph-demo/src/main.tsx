const workerApp = new Worker(new URL('./App.worker.tsx', import.meta.url), {
  type: 'module',
})

const htmlCanvasElement = document.createElement('canvas')
const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('No root element defined.')
}
rootElement.appendChild(htmlCanvasElement)
document.body.appendChild(rootElement)
htmlCanvasElement.width = 800
htmlCanvasElement.height = 600

const offscreenCanvas = htmlCanvasElement.transferControlToOffscreen()

workerApp.postMessage({ canvas: offscreenCanvas }, [offscreenCanvas])
