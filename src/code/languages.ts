import { bundledLanguages, bundledLanguagesInfo } from "shiki";
import hljs from "highlight.js";
import { extname } from "node:path";

const EXTENSIONS: Record<string, string> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", ts: "typescript", mts: "typescript", cts: "typescript",
  jsx: "jsx", tsx: "tsx", py: "python", rb: "ruby", rs: "rust", sh: "bash", ps1: "powershell",
  yml: "yaml", md: "markdown", cs: "csharp", h: "c", hpp: "cpp", txt: "text",
};
const ALIASES: Record<string, string> = { plaintext: "text", plain: "text", shell: "bash", objectivec: "objc" };
export const LANGUAGES = ["text", "cedar", ...Object.keys(bundledLanguages)];
export function resolveLanguage(requested: string, code: string, filename?: string): string {
  let language = requested.toLowerCase();
  if (language === "auto") {
    const extension = filename ? extname(filename).slice(1).toLowerCase() : "";
    language = EXTENSIONS[extension] ?? extension;
    if (!language || !(language in bundledLanguages) && !["text", "cedar"].includes(language)) language = hljs.highlightAuto(code).language ?? "text";
  }
  language = ALIASES[language] ?? language;
  if (language === "text" || language === "cedar") return language;
  const info = bundledLanguagesInfo.find((item) => item.id === language || item.aliases?.includes(language));
  if (!info && requested === "auto") return "text";
  if (!info) throw new Error(`Unknown language: ${requested}. Run snipix languages`);
  return info.id;
}
