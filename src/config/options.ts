import { extname } from "node:path";
import { DEFAULTS, FONTS, PADDING_OPTIONS, SIZE_OPTIONS } from "./constants";
import { THEMES } from "../themes";

export interface RenderOptions {
  theme: string; background: boolean; darkMode: boolean; lineNumbers?: boolean;
  padding: number; size: number; width: number; fontSize: number; font: string;
  title: string; subtitle: string; language: string; format: boolean;
  printWidth: number; tabWidth: number; highlight: number[];
  output: string; type: "png" | "svg"; json: boolean;
}

function number(value: unknown, name: string, min: number, max: number) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${name} must be an integer from ${min} to ${max}`);
  return n;
}

export function parseHighlights(value = ""): number[] {
  if (!value) return [];
  const result = new Set<number>();
  for (const range of value.split(",")) {
    if (!/^\d+(-\d+)?$/.test(range)) throw new Error("highlight must use line numbers, e.g. 1,3-5");
    const [start, end = start] = range.split("-").map(Number);
    if (start < 1 || end < start || end > 10000) throw new Error("highlight range must be within 1-10000 and ascending");
    for (let i = start; i <= end; i++) result.add(i);
  }
  return [...result];
}

export function normalizeOptions(raw: Record<string, any>): RenderOptions {
  const opts: Record<string, any> = { ...DEFAULTS, ...raw };
  if (!THEMES[opts.theme]) throw new Error(`Unknown theme: ${opts.theme}. Run snipix themes`);
  const padding = number(opts.padding, "padding", 0, 128);
  if (!(PADDING_OPTIONS as readonly number[]).includes(padding)) throw new Error("padding must be 16, 32, 64, or 128");
  const size = Number(String(opts.size).replace(/x$/, ""));
  if (!(SIZE_OPTIONS as readonly number[]).includes(size)) throw new Error("size must be 2x, 4x, or 6x");
  const output = opts.output ?? `snipix.${opts.type ?? "png"}`;
  const extension = extname(output).slice(1).toLowerCase();
  const type = opts.type ?? (output === "-" ? "png" : extension);
  if (!["png", "svg"].includes(type)) throw new Error("Export type must be png or svg (use --type or an output extension)");
  if (output !== "-" && extension && extension !== type) throw new Error("Output extension does not match --type");
  const theme = THEMES[opts.theme];
  const themeFont = theme.font === "soehne-mono" ? "commit-mono" : theme.font;
  const font = opts.font ?? themeFont ?? "jetbrains-mono";
  if (!(font in FONTS)) throw new Error(`Unknown font: ${font}. Run snipix fonts`);
  if (opts.json && output === "-") throw new Error("--json cannot be used with binary output on stdout");
  return {
    ...opts, padding, size, output, type, font,
    theme: opts.theme, background: opts.background, title: opts.title, subtitle: opts.subtitle,
    language: opts.language, format: opts.format,
    darkMode: theme.syntax.light ? opts.darkMode : true,
    width: number(opts.width, "width", 320, 2400),
    fontSize: number(opts.fontSize, "font-size", 8, 48),
    printWidth: number(opts.printWidth, "print-width", 20, 240),
    tabWidth: number(opts.tabWidth, "tab-width", 1, 8),
    highlight: parseHighlights(opts.highlight), json: !!opts.json,
  };
}
