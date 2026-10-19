import { createHighlighterCore, bundledLanguages, type BundledLanguage, type LanguageRegistration, type ThemeRegistration } from "shiki";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { createCssVariablesTheme } from "../../vendor/ray-so/util/theme-css-variables";
import cedar from "../../vendor/ray-so/util/langs/cedar";
import tailwindDark from "../../vendor/ray-so/assets/tailwind/dark.json";
import tailwindLight from "../../vendor/ray-so/assets/tailwind/light.json";

export interface CodeToken { content: string; color?: string; fontStyle?: number }
export type HighlightedCode = CodeToken[][];

const theme = createCssVariablesTheme({ name: "ray", variablePrefix: "--ray-" });
export async function highlightCode(code: string, language: string, themeId?: string, dark = true): Promise<HighlightedCode> {
  const syntax = themeId === "tailwind" ? (dark ? tailwindDark : tailwindLight) as ThemeRegistration : theme;
  const highlighter = await createHighlighterCore({
    engine: createOnigurumaEngine(import("shiki/wasm")),
    themes: [syntax],
    langs: language === "cedar" ? cedar as LanguageRegistration[] : language === "text" ? [] : [bundledLanguages[language as BundledLanguage]],
  });
  try {
    return highlighter.codeToTokens(code, { lang: language, theme: syntax.name! }).tokens;
  } finally {
    highlighter.dispose();
  }
}
