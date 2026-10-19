import { parse, type Font, type Glyph } from "opentype.js";
import { FONT_FILES, FALLBACK_FILES } from "../assets/fonts";
import { round, xml } from "./xml";

const loaded = new Map<string, Promise<Font>>();
function load(path: string) {
  if (!loaded.has(path)) loaded.set(path, Bun.file(path).arrayBuffer().then((bytes) => parse(bytes)));
  return loaded.get(path)!;
}

export interface Character {
  glyph: Glyph;
  font: Font;
  advance: number;
}

export class OutlinedFont {
  private constructor(private fonts: Font[], readonly size: number) {}
  static async load(name: string, size: number) {
    const fonts = await Promise.all([FONT_FILES[name], ...FALLBACK_FILES].map(load));
    return new OutlinedFont(fonts, size);
  }
  character(text: string): Character {
    for (const font of this.fonts) {
      const glyph = font.charToGlyph(text);
      if (glyph.index !== 0) return { glyph, font, advance: (glyph.advanceWidth ?? font.unitsPerEm * 0.6) / font.unitsPerEm * this.size + 0.1 };
    }
    throw new Error(`Bundled fonts have no glyph for U+${text.codePointAt(0)!.toString(16).toUpperCase()} (${text}). Replace this character; emoji and complex scripts are not supported.`);
  }
  width(text: string) { return [...text].reduce((width, char) => width + this.character(char).advance, 0); }
}

// Each glyph outline is stored once and reused. SVGs do not need installed fonts.
export class GlyphWriter {
  private glyphs = new Map<Glyph, Map<number, string>>();
  readonly definitions: string[] = [];
  draw(char: Character, size: number, x: number, y: number, italic = false) {
    let sizes = this.glyphs.get(char.glyph);
    if (!sizes) { sizes = new Map(); this.glyphs.set(char.glyph, sizes); }
    let id = sizes.get(size);
    if (!id) {
      id = `glyph-${this.definitions.length}`;
      sizes.set(size, id);
      const path = char.glyph.getPath(0, 0, size).toPathData(3);
      this.definitions.push(`<path id="${id}" d="${path}"/>`);
    }
    return `<use href="#${id}" transform="translate(${round(x)} ${round(y)})${italic ? " skewX(-12)" : ""}"/>`;
  }
  text(text: string, font: OutlinedFont, x: number, y: number, fill: string, maxWidth = Infinity) {
    let paths = "";
    let width = 0;
    for (const point of text) {
      const char = font.character(point);
      if (width + char.advance > maxWidth) break;
      paths += this.draw(char, font.size, x + width, y);
      width += char.advance;
    }
    return `<g aria-label="${xml(text)}" fill="${xml(fill)}">${paths}</g>`;
  }
}
