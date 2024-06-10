# Offscreen Paragraph Demo

![Expected Result](../paragraph-demo/paragraph-demo.gif)

1. Build the core library first
2. `npm install`
3. `npm run dev`

Note that hot module reloading is disabled. Otherwise, the web worker will error with `Uncaught ReferenceError: $RefreshSig$ is not defined`. Exact cause (other than something with vite/rollup hmr interaction with react-refresh in web workers) and fix unknown.
