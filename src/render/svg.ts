import type { HighlightedCode } from "../code/highlight";
import type { RenderOptions } from "../config/options";
import { THEMES } from "../themes";
import { frameStyle } from "../themes/frames";
import { color, tokenColor } from "./colors";
import { OutlinedFont, GlyphWriter } from "./fonts";
import { layoutCode } from "./layout";
import { drawBackground } from "./background";
import { xml, round } from "./xml";

export async function renderSvg(code: string, tokens: HighlightedCode, options: RenderOptions) {
  const theme = THEMES[options.theme];
  const style = frameStyle(options.theme, options.darkMode);
  const font = await OutlinedFont.load(options.font, options.fontSize);
  const uiFont = await OutlinedFont.load("inter", 12);
  const lineNumbers = options.lineNumbers ?? theme.lineNumbers ?? false;
  const layout = layoutCode(tokens, font, options, style, lineNumbers);
  const { panelX: x, panelY: y, panelWidth: width, panelHeight: height } = layout;
  const scale = options.type === "png" ? options.size : 1;
  if (layout.height * scale > 30000 || layout.height * options.width * scale ** 2 > 100_000_000) {
    throw new Error("Image is too large; reduce code length, width, font size, or export size");
  }
  const variables = (options.darkMode ? theme.syntax.dark : theme.syntax.light) ?? theme.syntax.dark ?? theme.syntax.light ?? {};
  const foreground = color(variables["--ray-foreground"], options.darkMode ? "#fff" : "#111");
  const muted = options.darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const glyphs = new GlyphWriter();
  let body = await drawBackground(theme, style, options, layout.height);
  const panel = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${style.radius}" fill="${style.panel}" stroke="${style.border}"/>`;
  if (options.background) {
    body += `<defs><filter id="shadow" x="-50%" y="-100%" width="200%" height="300%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="14"/></filter></defs><rect x="${x}" y="${y + 18}" width="${width}" height="${height}" rx="${style.radius}" fill="#000" opacity="0.18" filter="url(#shadow)"/>`;
  }
  if (style.grid && options.background) {
    body += `<path d="M0 ${y}H${options.width} M0 ${y + height}H${options.width} M${x} 0V${layout.height} M${x + width} 0V${layout.height}" stroke="${options.darkMode ? "#333640" : "#d9dce3"}" stroke-width="1" fill="none"/>`;
  }
  body += panel;
  body += `<defs><clipPath id="panel-clip"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${style.radius}"/></clipPath></defs><g clip-path="url(#panel-clip)">`;
  if (style.header === "dots") {
    body += `<g fill="${options.darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}">`;
    for (let i = 0; i < 3; i++) body += `<circle cx="${x + 23 + i * 23}" cy="${y + 22}" r="7"/>`;
    body += "</g>";
    const titleWidth = Math.max(0, width - 180);
    // Center only the title that fits; clip the rest to keep it away from controls.
    let title = "";
    let titleSize = 0;
    for (const char of options.title) {
      const advance = uiFont.character(char).advance;
      if (titleSize + advance > titleWidth) break;
      title += char;
      titleSize += advance;
    }
    body += glyphs.text(title, uiFont, x + (width - uiFont.width(title)) / 2, y + 26, muted);
  } else if (style.header === "tab") {
    body += `<rect x="${x}" y="${y}" width="${width}" height="${style.headerHeight}" fill="${options.darkMode ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.025)"}"/><path d="M${x} ${y + style.headerHeight}H${x + width}" stroke="${style.border}"/>`;
    body += glyphs.text(options.title, uiFont, x + 16, y + 25, style.accent ?? foreground, width - 32);
  }
  if (options.theme === "auth0" && options.subtitle) body += glyphs.text(options.subtitle, uiFont, x + 16, y + style.headerHeight + 14, muted, width - 32);
  const highlighted = new Set(options.highlight);
  for (const [index, row] of layout.rows.entries()) {
    const top = layout.codeY + index * layout.lineHeight;
    const baseline = top + (layout.lineHeight - options.fontSize) / 2 + options.fontSize * 0.8;
    body += `<g data-line="${row.line}"${highlighted.has(row.line) ? ' class="highlighted-line"' : ""}>`;
    if (highlighted.has(row.line)) {
      body += `<rect x="${x}" y="${round(top)}" width="${width}" height="${layout.lineHeight}" fill="${color(variables["--ray-highlight"], options.darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)")}"/><rect x="${x}" y="${round(top)}" width="2" height="${layout.lineHeight}" fill="${color(variables["--ray-highlight-border"], style.accent ?? foreground)}"/>`;
    }
    if (lineNumbers && row.first) {
      const number = String(row.line);
      body += glyphs.text(number, font, layout.codeX - 16 - font.width(number), baseline, muted);
    }
    for (const character of row.characters) {
      const fill = tokenColor(character.color, variables, foreground);
      const px = layout.codeX + character.x;
      body += `<g fill="${xml(fill)}"${character.fontStyle & 2 ? ` stroke="${xml(fill)}" stroke-width="0.25"` : ""}>${glyphs.draw(character, options.fontSize, px, baseline, !!(character.fontStyle & 1))}</g>`;
      if (character.fontStyle & 4) body += `<path d="M${round(px)} ${round(baseline + 2)}h${round(character.advance)}" stroke="${xml(fill)}"/>`;
    }
    body += "</g>";
  }
  body += "</g>";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${layout.height}" viewBox="0 0 ${options.width} ${layout.height}" data-theme="${options.darkMode ? "dark" : "light"}" data-frame="${xml(options.theme)}" role="img"><title>${xml(options.title || "Code image")}</title><desc>${xml(code)}</desc><defs>${glyphs.definitions.join("")}</defs>${body}</svg>`;
  return { svg, width: options.width, height: layout.height };
}
