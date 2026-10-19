import { expect, test } from "bun:test";
import { normalizeOptions } from "../src/config/options";
import { OutlinedFont } from "../src/render/fonts";
import { layoutCode } from "../src/render/layout";
import { frameStyle } from "../src/themes/frames";
import { highlightCode } from "../src/code/highlight";
import { renderImage } from "../src/export/render";
import { FONTS } from "../src/config/constants";

test("wrapping preserves content, logical numbers, tabs, and empty lines", async () => {
  const font = await OutlinedFont.load("jetbrains-mono", 15);
  const opts = normalizeOptions({ width: 320, padding: 64 });
  const source = "\t" + "a".repeat(80);
  const layout = layoutCode([[{ content: source }], [{ content: "" }], [{ content: "tail" }]], font, opts, frameStyle("candy", true), true);
  expect(layout.rows.length).toBeGreaterThan(3);
  expect(layout.rows.filter((row) => row.line === 1).map((row) => row.characters.map((char) => char.text).join("")).join(""))
    .toBe("  " + "a".repeat(80));
  expect(layout.rows.filter((row) => row.first).map((row) => row.line)).toEqual([1, 2, 3]);
  expect(layout.rows.find((row) => row.line === 2)?.characters).toHaveLength(0);
});

test("impossible width fails instead of clipping code", async () => {
  const font = await OutlinedFont.load("jetbrains-mono", 48);
  expect(() => layoutCode([[{ content: "x" }]], font, normalizeOptions({ width: 320, padding: 128, fontSize: 48 }), frameStyle("candy", true), true))
    .toThrow("too narrow");
});

test("wrapped line highlighting covers every visual row and numbers appear once", async () => {
  const source = "a".repeat(80);
  const tokens = await highlightCode(source, "text");
  const { bytes } = await renderImage(source, tokens, normalizeOptions({ type: "svg", width: 320, highlight: "1", lineNumbers: true }));
  const svg = bytes.toString();
  const rows = [...svg.matchAll(/data-line="1"/g)].length;
  expect(rows).toBeGreaterThan(1);
  expect([...svg.matchAll(/class="highlighted-line"/g)]).toHaveLength(rows);
  expect([...svg.matchAll(/aria-label="1"/g)]).toHaveLength(1);
});

test("all advertised fonts work without system fonts", async () => {
  const tokens = await highlightCode("const x = 1;", "javascript");
  const paths = new Set<string>();
  for (const font of Object.keys(FONTS)) {
    const { bytes } = await renderImage("const x = 1;", tokens, normalizeOptions({ type: "svg", font }));
    const svg = bytes.toString();
    expect(svg).toContain("<use");
    paths.add(svg);
  }
  expect(paths.size).toBe(Object.keys(FONTS).length);
});

test("unsupported glyphs fail clearly instead of silently disappearing", async () => {
  const font = await OutlinedFont.load("jetbrains-mono", 15);
  expect(() => font.width("😀")).toThrow("no glyph");
});

test("bundled fallback glyphs cover common accented, Greek and Cyrillic text", async () => {
  const source = "café λ Привет";
  const tokens = await highlightCode(source, "text");
  const { bytes } = await renderImage(source, tokens, normalizeOptions({ type: "svg" }));
  expect(bytes.toString()).toContain(`<desc>${source}</desc>`);
  expect(bytes.toString()).toContain("<use");
});
