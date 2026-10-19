import { createRequire } from "node:module";
import { join } from "node:path";
import { readdir, mkdir } from "node:fs/promises";
import project from "../package.json";

async function packageRoot(name: string, parent: string) {
  const require = createRequire(join(parent, "package.json"));
  for (const base of require.resolve.paths(name) ?? []) {
    const directory = join(base, name);
    const file = Bun.file(join(directory, "package.json"));
    if (await file.exists() && (await file.json()).name === name) return directory;
  }
  throw new Error(`Cannot find license metadata for ${name}`);
}

export async function generateNotices() {
  const resvg = await Bun.file(join(await packageRoot("@resvg/resvg-wasm", process.cwd()), "package.json")).json();
  const resvgLicense = `.cache/licenses/resvg-${resvg.version}.txt`;
  if (!await Bun.file(resvgLicense).exists()) {
    const response = await fetch(`https://raw.githubusercontent.com/yisibl/resvg-js/v${resvg.version}/LICENSE`);
    if (!response.ok) throw new Error(`Cannot fetch resvg license: HTTP ${response.status}`);
    await mkdir(".cache/licenses", { recursive: true });
    await Bun.write(resvgLicense, await response.text());
  }
  const sections = [
    "SNIPIX: THIRD-PARTY NOTICES\n\nGenerated from the installed runtime dependency tree.\nThe Snipix source is MIT-licensed; individual dependencies keep their own licenses.\n",
    `Snipix / Ray.so / Raycast\nSource: https://github.com/raycast/ray-so\n\n${await Bun.file("LICENSE").text()}`,
    `resvg-js / @resvg/resvg-wasm ${resvg.version}\nLicense: MPL-2.0\nUnmodified covered source: https://github.com/yisibl/resvg-js/tree/v${resvg.version}\n\n${await Bun.file(resvgLicense).text()}`,
    `Bun runtime ${Bun.version}\nSource and license notices: https://github.com/oven-sh/bun/tree/bun-v${Bun.version}\n`,
  ];
  const visited = new Set<string>();
  async function visit(name: string, parent: string) {
    if (name.startsWith("@types/")) return;
    const directory = await packageRoot(name, parent);
    const metadata = await Bun.file(join(directory, "package.json")).json();
    const key = `${name}@${metadata.version}`;
    if (visited.has(key)) return;
    visited.add(key);
    const notices = (await readdir(directory)).filter((file) => /^(licen[sc]e|notice|copying)(\..*)?$/i.test(file)).sort();
    const texts = await Promise.all(notices.map((file) => Bun.file(join(directory, file)).text()));
    sections.push(`${key}\nLicense: ${metadata.license ?? "See package source"}\nSource: ${typeof metadata.repository === "string" ? metadata.repository : metadata.repository?.url ?? metadata.homepage ?? "npm registry"}\n\n${texts.join("\n\n") || "See source URL for license text."}`);
    for (const child of Object.keys(metadata.dependencies ?? {}).sort()) await visit(child, directory);
  }
  for (const name of Object.keys(project.dependencies).sort()) await visit(name, process.cwd());
  await Bun.write("THIRD_PARTY_NOTICES.txt", sections.join("\n\n" + "=".repeat(72) + "\n\n") + "\n");
}

if (import.meta.main) await generateNotices();
