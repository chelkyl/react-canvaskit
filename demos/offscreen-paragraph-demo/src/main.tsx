const workerApp = new Worker(new URL('./App.worker', import.meta.url), {
  type: 'module',
})

const htmlCanvasElement = document.createElement('canvas')
const rootElement = document.querySelector('#root')
if (!rootElement) {
  throw new Error('No root element defined.')
}
rootElement.appendChild(htmlCanvasElement)
htmlCanvasElement.width = 800
htmlCanvasElement.height = 600

const offscreenCanvas = htmlCanvasElement.transferControlToOffscreen()

workerApp.postMessage({ canvas: offscreenCanvas }, [offscreenCanvas])
