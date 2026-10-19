import { describe, expect, test } from "bun:test";
import { normalizeOptions, parseHighlights } from "../src/config/options";
import { LANGUAGES, resolveLanguage } from "../src/code/languages";
import { readCode } from "../src/cli/input";

describe("render options", () => {
  test("defaults match Ray.so controls", () => {
    const options = normalizeOptions({});
    expect({ theme: options.theme, padding: options.padding, size: options.size, background: options.background, dark: options.darkMode })
      .toEqual({ theme: "candy", padding: 64, size: 4, background: true, dark: true });
  });
  test("infers SVG output and preserves explicit theme overrides", () => {
    expect(normalizeOptions({ output: "out.svg", theme: "clerk", lineNumbers: false }).type).toBe("svg");
    expect(normalizeOptions({ theme: "clerk", lineNumbers: false }).lineNumbers).toBe(false);
  });
  test.each([{ theme: "bad" }, { padding: 30 }, { size: "3x" }, { width: "NaN" }, { width: 12 },
    { font: "missing" }, { output: "a.svg", type: "png" }, { output: "a.jpg" }, { output: "-", json: true },
    { fontSize: 100 }, { tabWidth: 0 }])("rejects invalid options %j", (raw) => {
    expect(() => normalizeOptions(raw)).toThrow();
  });
  test("dark-only theme ignores a light-mode request", () => {
    expect(normalizeOptions({ theme: "stripe", darkMode: false }).darkMode).toBe(true);
  });
  test("expands and deduplicates highlight ranges", () => {
    expect(parseHighlights("1,3-5,4")).toEqual([1, 3, 4, 5]);
  });
  test.each(["0", "3-1", "1,no", "1-10001"])("rejects invalid highlight %s", (value) => {
    expect(() => parseHighlights(value)).toThrow();
  });
});
test("language selection uses filename first and resolves aliases", () => {
  expect(resolveLanguage("auto", "const x = 1", "app.ts")).toBe("typescript");
  expect(resolveLanguage("shell", "echo hi")).toBe("shellscript");
  expect(resolveLanguage("plaintext", "hello")).toBe("text");
  expect(resolveLanguage("cedar", "permit(principal, action, resource);")).toBe("cedar");
  expect(LANGUAGES.includes(resolveLanguage("auto", "const x=1"))).toBe(true);
  expect(() => resolveLanguage("not-a-language", "hello")).toThrow("Unknown language");
});
test("input rejects ambiguity and empty snippets", async () => {
  expect(readCode("file.ts", "x")).rejects.toThrow("not both");
  expect(readCode(undefined, "  ")).rejects.toThrow("empty");
  expect(await readCode(undefined, "a\r\nb\r\n")).toBe("a\nb");
});
