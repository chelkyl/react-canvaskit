# Build

- `npm install && npm run build`

# Run

- `npm run dev`

_Something_ may cause an issue in dev mode (possibly related to hot refreshes) where the worker (specifically `useAnimationFrame.tsx`) will error with `Uncaught ReferenceError: $RefreshSig$ is not defined`. If this is the case for you, you can try doing a production build instead.

- `npm run preview`
