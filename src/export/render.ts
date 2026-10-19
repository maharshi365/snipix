import { initWasm, Resvg } from "@resvg/resvg-wasm";
import wasm from "@resvg/resvg-wasm/index_bg.wasm" with { type: "file" };
import type { HighlightedCode } from "../code/highlight";
import type { RenderOptions } from "../config/options";
import { renderSvg } from "../render/svg";

let ready: Promise<void> | undefined;
export async function renderImage(code: string, tokens: HighlightedCode, options: RenderOptions) {
  const image = await renderSvg(code, tokens, options);
  if (options.type === "svg") return { bytes: Buffer.from(image.svg), width: image.width, height: image.height };
  await (ready ??= Bun.file(wasm).arrayBuffer().then((bytes) => initWasm(bytes)));
  const renderer = new Resvg(image.svg, { fitTo: { mode: "zoom", value: options.size }, font: { loadSystemFonts: false } });
  try {
    const png = renderer.render();
    try { return { bytes: Buffer.from(png.asPng()), width: png.width, height: png.height }; }
    finally { png.free(); }
  } finally { renderer.free(); }
}
