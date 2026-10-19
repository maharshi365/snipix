import * as prettier from "prettier/standalone";
import * as babel from "prettier/plugins/babel";
import * as estree from "prettier/plugins/estree";
import * as typescript from "prettier/plugins/typescript";
import * as markdown from "prettier/plugins/markdown";
import * as html from "prettier/plugins/html";
import * as postcss from "prettier/plugins/postcss";
import * as yaml from "prettier/plugins/yaml";
import * as graphql from "prettier/plugins/graphql";
import ruffWasm from "@astral-sh/ruff-wasm-web/ruff_wasm_bg.wasm" with { type: "file" };

let ruffReady: Promise<void> | undefined;

export const PARSERS: Record<string, string> = {
  javascript: "babel", jsx: "babel", typescript: "typescript", tsx: "typescript",
  json: "json", jsonc: "jsonc", markdown: "markdown", mdx: "mdx", html: "html",
  vue: "vue", css: "css", scss: "scss", less: "less", yaml: "yaml", graphql: "graphql",
};
export async function formatCode(code: string, language: string, printWidth = 80, tabWidth = 2) {
  if (language === "python") {
    const { Workspace, PositionEncoding, initSync } = await import("@astral-sh/ruff-wasm-web");
    await (ruffReady ??= Bun.file(ruffWasm).arrayBuffer().then((module) => { initSync({ module }); }));
    const workspace = new Workspace({ ...Workspace.defaultSettings(), "line-length": printWidth }, PositionEncoding.Utf16);
    try { return workspace.format(code).replace(/\n$/, ""); }
    finally { workspace.free(); }
  }
  const parser = PARSERS[language];
  if (!parser) throw new Error(`Code formatting is not supported for ${language}; omit --format`);
  return (await prettier.format(code, { parser, plugins: [babel, estree, typescript, markdown, html, postcss, yaml, graphql],
    singleQuote: false, printWidth, tabWidth })).replace(/\n$/, "");
}
