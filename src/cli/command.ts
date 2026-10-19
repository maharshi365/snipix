import { Command } from "commander";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DEFAULTS, FONTS, PADDING_OPTIONS, SIZE_OPTIONS } from "../config/constants";
import { normalizeOptions } from "../config/options";
import { THEMES } from "../themes";
import { LANGUAGES, resolveLanguage } from "../code/languages";
import { formatCode } from "../code/format";
import { highlightCode } from "../code/highlight";
import { renderImage } from "../export/render";
import { readCode } from "./input";
import { NAME, VERSION } from "../config/project";
import license from "../../LICENSE" with { type: "file" };

declare const SNIPIX_NOTICES: string;

function list(value: unknown, json: boolean) {
  console.log(json ? JSON.stringify(value) : Array.isArray(value) ? value.join("\n") : JSON.stringify(value, null, 2));
}

export function createProgram() {
  const program = new Command().name(NAME).version(VERSION)
    .description("Generate Ray.so code images locally. Accepts files, --code, or stdin.")
    .showHelpAfterError();
  const render = program.command("render", { isDefault: true }).description("Export a code snippet as PNG or SVG")
    .argument("[file]", "source file, or - for stdin")
    .option("-c, --code <text>", "inline source code")
    .option("-o, --output <path>", "output file, or - for raw stdout (default: snipix.png)")
    .option("--type <type>", "png or svg; inferred from output extension")
    .option("-t, --theme <name>", "Ray.so theme (see themes)", DEFAULTS.theme)
    .option("--no-background", "transparent canvas around the window")
    .option("--background", "show theme background")
    .option("--no-dark-mode", "light window (Stripe is dark-only)")
    .option("--dark-mode", "dark window")
    .option("--line-numbers", "show line numbers (overrides theme default)")
    .option("--no-line-numbers", "hide line numbers")
    .option("-p, --padding <pixels>", "16, 32, 64, or 128", String(DEFAULTS.padding))
    .option("-l, --language <id>", "syntax language, or auto", "auto")
    .option("-s, --size <scale>", "PNG pixel scale: 2x, 4x, or 6x; SVG stays at logical size", "4x")
    .option("-w, --width <pixels>", "canvas width, 320-2400; long lines wrap", String(DEFAULTS.width))
    .option("--font <name>", "font ID (see fonts); default follows theme")
    .option("--font-size <pixels>", "code font size, 8-48", String(DEFAULTS.fontSize))
    .option("--title <text>", "window filename/title", "")
    .option("--subtitle <text>", "subtitle in frames that support it (Auth0)", "")
    .option("--highlight <lines>", "highlight lines, e.g. 1,3-5")
    .option("--format", "format code with Prettier or Ruff before rendering")
    .option("--print-width <columns>", "formatter line width", "80")
    .option("--tab-width <spaces>", "formatter indentation width (Prettier)", "2")
    .option("--json", "write a machine-readable result to stdout; errors go to stderr")
    .addHelpText("after", `\nExamples:\n  snipix render src/app.ts -o app.png --theme breeze --line-numbers\n  snipix render --code 'const x=1' -l javascript --format -o code.svg\n  cat app.py | snipix render - -l python --format -o app.png --json\n\nNative SVG and PNG rendering. No browser, installed fonts, or runtime downloads.\nSVG text is outlined for portable rendering. Partner frames are approximations.`);

  render.action(async (file, raw) => {
    const options = normalizeOptions(raw);
    const source = await readCode(file, raw.code);
    options.language = resolveLanguage(options.language, source, file);
    const code = options.format ? await formatCode(source, options.language, options.printWidth, options.tabWidth) : source;
    const tokens = await highlightCode(code, options.language, options.theme, options.darkMode);
    const image = await renderImage(code, tokens, options);
    if (options.output === "-") {
      await Bun.write(Bun.stdout, image.bytes);
      return;
    }
    const output = resolve(options.output);
    await mkdir(dirname(output), { recursive: true });
    await Bun.write(output, image.bytes);
    const result = { output, type: options.type, width: image.width, height: image.height,
      bytes: image.bytes.length, language: options.language, theme: options.theme };
    if (options.json) console.log(JSON.stringify(result));
    else console.error(`Saved ${output} (${image.width}×${image.height}, ${options.type})`);
  });
  program.command("themes").description("List theme IDs").option("--json", "JSON output")
    .action((opts) => list(Object.keys(THEMES), opts.json));
  program.command("languages").description("List syntax language IDs").option("--json", "JSON output")
    .action((opts) => list(LANGUAGES, opts.json));
  program.command("fonts").description("List bundled open-source fonts").option("--json", "JSON output")
    .action((opts) => list(Object.keys(FONTS), opts.json));
  program.command("options").description("Show defaults and choices for agents").option("--json", "JSON output")
    .action((opts) => list({ defaults: DEFAULTS, padding: PADDING_OPTIONS, sizes: SIZE_OPTIONS,
      themes: Object.keys(THEMES), fonts: Object.keys(FONTS), languages: LANGUAGES, exports: ["png", "svg"] }, opts.json));
  program.command("licenses").description("Show bundled third-party license notices")
    .action(async () => { console.log(typeof SNIPIX_NOTICES === "undefined" ? await Bun.file(license).text() : SNIPIX_NOTICES); });
  return program;
}
