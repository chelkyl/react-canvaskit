import { init, render } from "react-canvaskit";

import { App } from "./App";

const htmlCanvasElement = document.createElement("canvas");
const rootElement = document.querySelector("#root");
if (!rootElement) {
  throw new Error("No root element defined.");
}
rootElement.appendChild(htmlCanvasElement);
htmlCanvasElement.width = 400;
htmlCanvasElement.height = 300;

await init();
await render(<App />, htmlCanvasElement);
