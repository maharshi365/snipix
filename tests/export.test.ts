import { expect, test } from "bun:test";
import { PNG } from "pngjs";
import { normalizeOptions } from "../src/config/options";
import { highlightCode } from "../src/code/highlight";
import { renderImage } from "../src/export/render";
import { THEMES } from "../src/themes";

const code = 'const greet = (name) => {\n  return `Hello, ${name}!`;\n};';

test("PNG pipeline respects transparency, dimensions and size", async () => {
  const html = await highlightCode(code, "javascript");
  const options = normalizeOptions({ size: "2x", background: false, width: 520, lineNumbers: true, highlight: "2" });
  const result = await renderImage(code, html, options);
  const png = PNG.sync.read(result.bytes);
  expect(png.width).toBe(1040);
  expect(png.height).toBe(result.height);
  expect(png.data[3]).toBe(0); // Outer padding is transparent.
  const center = ((Math.floor(png.height / 2) * png.width) + png.width / 2) * 4;
  expect(png.data[center + 3]).toBeGreaterThan(0); // Window is visible.
  const larger = await renderImage(code, html, { ...options, size: 4 });
  const png4 = PNG.sync.read(larger.bytes);
  expect(png4.width).toBe(png.width * 2);
  expect(png4.height).toBe(png.height * 2);
}, 60000);

test("SVG contains escaped source, line highlights, title, outlined text and light window", async () => {
  const source = 'const html = "<script>alert(1)</script>";';
  const html = await highlightCode(source, "javascript");
  const result = await renderImage(source, html, normalizeOptions({ type: "svg", title: "safe.ts", darkMode: false, lineNumbers: true, highlight: "1" }));
  const svg = result.bytes.toString();
  expect(svg).not.toContain("<foreignObject");
  expect(svg).toContain("&lt;script&gt;");
  expect(svg).not.toContain("<script>");
  expect(svg).toContain("highlighted-line");
  expect(svg).toContain('data-line="1"');
  expect(svg.includes("safe.ts")).toBe(true);
  expect(svg).toContain('data-theme="light"');
  expect(svg).toContain('<path id="glyph-');
  expect(svg).not.toContain("<text");
  expect(svg).not.toMatch(/url\(["']?http/);
}, 60000);

test("every theme exports a native SVG and a nonempty PNG", async () => {
  const html = await highlightCode(code, "javascript");
  for (const theme of Object.keys(THEMES)) {
    const result = await renderImage(code, html, normalizeOptions({ theme, type: "svg", size: 2 }))
      .catch((error) => { throw new Error(`${theme}: ${error.message}`); });
    const svg = result.bytes.toString();
    expect(result.height, theme).toBeGreaterThan(128);
    expect(svg, theme).toContain("const");
    expect(svg, theme).not.toContain("<foreignObject");
    expect(svg, theme).toContain('data-frame="' + theme + '"');
    expect(svg, theme).not.toContain("http://127.0.0.1:");
    const raster = await renderImage(code, html, normalizeOptions({ theme, type: "png", size: 2 }));
    const png = PNG.sync.read(raster.bytes);
    expect(png.width, theme).toBe(1360);
    expect(png.data.some((value, index) => index % 4 === 3 && value > 0), theme).toBe(true);
  }
}, 180000);
