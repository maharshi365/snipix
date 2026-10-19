import type { HighlightedCode } from "../code/highlight";
import type { RenderOptions } from "../config/options";
import type { FrameStyle } from "../themes/frames";
import { OutlinedFont, type Character } from "./fonts";

export interface PlacedCharacter extends Character { x: number; color?: string; fontStyle: number; text: string }
export interface VisualLine { line: number; first: boolean; characters: PlacedCharacter[] }
export interface Layout {
  rows: VisualLine[]; lineHeight: number; gutter: number; codeX: number; codeY: number;
  panelX: number; panelY: number; panelWidth: number; panelHeight: number; height: number;
}

export function layoutCode(tokens: HighlightedCode, font: OutlinedFont, options: RenderOptions, frame: FrameStyle, lineNumbers: boolean): Layout {
  const inset = 16;
  const gutter = lineNumbers ? Math.max(32, font.width(String(tokens.length)) + 16) : 0;
  const panelWidth = options.width - options.padding * 2;
  const available = panelWidth - inset * 2 - gutter;
  if (available < font.character("M").advance) throw new Error("Canvas is too narrow for the padding, font size and line numbers; increase --width or reduce --padding/--font-size");
  const rows: VisualLine[] = [];
  for (const [index, tokensOnLine] of tokens.entries()) {
    let row: VisualLine = { line: index + 1, first: true, characters: [] };
    let x = 0;
    let column = 0;
    for (const token of tokensOnLine) {
      for (const point of token.content) {
        // Tabs keep the same two-space stops as Ray.so's editor.
        const text = point === "\t" ? " ".repeat(2 - column % 2) : point;
        for (const char of text) {
          const character = font.character(char);
          if (x + character.advance > available + 0.001 && row.characters.length) {
            rows.push(row);
            row = { line: index + 1, first: false, characters: [] };
            x = 0;
          }
          row.characters.push({ ...character, x, text: char, color: token.color, fontStyle: token.fontStyle ?? 0 });
          x += character.advance;
          column++;
        }
      }
    }
    rows.push(row);
    if (rows.length > 10000) throw new Error("Image has too many wrapped lines; reduce code length or increase --width");
  }
  const lineHeight = options.fontSize * 1.5;
  const subtitle = options.theme === "auth0" && options.subtitle ? 20 : 0;
  const headerHeight = frame.headerHeight + subtitle;
  const panelHeight = Math.max(100, headerHeight + inset * 2 + rows.length * lineHeight);
  return { rows, lineHeight, gutter, codeX: options.padding + inset + gutter,
    codeY: options.padding + headerHeight + inset,
    panelX: options.padding, panelY: options.padding, panelWidth, panelHeight,
    height: Math.ceil(options.padding * 2 + panelHeight) };
}
