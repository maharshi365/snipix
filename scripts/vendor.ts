// Import the MIT-licensed code image UI from a local upstream checkout.
import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Usage: bun scripts/vendor.ts <ray-so-checkout>");
const source = join(root, "app/(navigation)/(code)");
await mkdir("vendor/ray-so/components", { recursive: true });
await mkdir("vendor/ray-so/util", { recursive: true });
await cp(join(source, "components/frames"), "vendor/ray-so/components/frames", { recursive: true });
await cp(join(source, "assets"), "vendor/ray-so/assets", { recursive: true });
for (const file of ["Editor.module.css"]) {
  await cp(join(source, "components", file), join("vendor/ray-so/components", file));
}
for (const file of ["theme-css-variables.ts", "useIsSafari.ts"]) {
  await cp(join(source, "util", file), join("vendor/ray-so/util", file));
}
await mkdir("vendor/ray-so/util/langs", { recursive: true });
await cp(join(source, "util/langs/cedar.ts"), "vendor/ray-so/util/langs/cedar.ts");
await mkdir("vendor/ray-so/lib", { recursive: true });
await cp(join(source, "lib/image.ts"), "vendor/ray-so/lib/image.ts");
await cp(join(root, "LICENSE"), "vendor/ray-so/LICENSE");
await mkdir("vendor/ray-so/public", { recursive: true });
await cp(join(root, "public/stars.svg"), "vendor/ray-so/public/stars.svg");
const raw = await Bun.file(join(source, "store/themes.ts")).text();
// Keep upstream's conversion and theme objects, without browser state or logos.
const conversion = raw.slice(raw.indexOf("function convertToShikiTheme"), raw.indexOf("export type Theme"));
const objects = raw.slice(raw.indexOf("export const THEMES"), raw.indexOf("const themeAtom"))
  .replace(/^\s*(icon|iconUrl):.*$/gm, "");
const js = new Bun.Transpiler({ loader: "ts" }).transformSync(`${conversion}\n${objects}`)
  .replace("export const THEMES", "const THEMES");
const themes = new Function(`${js}; return THEMES;`)();
await mkdir("src/themes", { recursive: true });
await Bun.write("src/themes/catalog.json", JSON.stringify(themes, null, 2) + "\n");
const globals = await Bun.file(join(root, "app/globals.css")).text();
await Bun.write("vendor/ray-so/variables.css", globals.slice(globals.indexOf(":root {", globals.indexOf("/* code images legacy */")), globals.indexOf("/* icon maker */")));
const commit = Bun.spawnSync(["git", "-C", root, "rev-parse", "HEAD"]).stdout.toString().trim();
await Bun.write("vendor/ray-so/UPSTREAM.md", `Source: https://github.com/raycast/ray-so\nCommit: ${commit}\nLicense: MIT (see the repository's root LICENSE for the Raycast credit)\n\nFrames, CSS, image export and syntax theme factory are copied unchanged.\nvariables.css is an excerpt of app/globals.css. src/themes/catalog.json is\ngenerated from store/themes.ts with icons and state removed. Assets are from\nthe code image UI. No proprietary font files are included.\n`);
