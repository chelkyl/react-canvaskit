import React, { useEffect } from "react";
import { FontManagerProvider } from "react-canvaskit";

import ParagraphDemo from "./ParagraphDemo";

const robotoPromise = fetch(
  "https://storage.googleapis.com/skia-cdn/google-web-fonts/Roboto-Regular.ttf"
).then((resp) => resp.arrayBuffer());
const notoColorEmojiPromise = fetch(
  "https://storage.googleapis.com/skia-cdn/misc/NotoColorEmoji.ttf"
).then((resp) => resp.arrayBuffer());

const fontsPromise = Promise.all([robotoPromise, notoColorEmojiPromise]);

function App() {
  const [fonts, setFonts] = React.useState<ArrayBuffer[] | undefined>(
    undefined
  );

  useEffect(() => {
    async function fetchFonts() {
      const fetchedFonts = await fontsPromise;
      setFonts(fetchedFonts);
    }
    fetchFonts();
  }, []);

  return (
    <FontManagerProvider fontData={fonts}>
      <ParagraphDemo />
    </FontManagerProvider>
  );
}

export default App;
