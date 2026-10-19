// Create publishable packages separately from the private development workspace.
import { Command, Option } from "commander";
import { cp, mkdir, chmod } from "node:fs/promises";
import { resolve, join } from "node:path";
import project from "../package.json";
import { PLATFORMS, hostPlatform } from "./platforms";

const command = new Command().description("Stage npm packages; does not publish anything")
  .addOption(new Option("--platform <id>", "platform binary to stage").choices(PLATFORMS.map((platform) => platform.id)))
  .option("--all", "stage every platform; requires binaries in --binaries")
  .option("--binaries <directory>", "directory containing snipix-<platform>[.exe]")
  .option("--outdir <directory>", "staging directory", "dist/npm")
  .parse();
const options = command.opts();
if (options.all && options.platform) throw new Error("Use --all or --platform, not both");
if (options.all && !options.binaries) throw new Error("--all requires --binaries with a build for each platform");
const selected = options.all ? PLATFORMS : PLATFORMS.filter((platform) => platform.id === (options.platform ?? hostPlatform()));
if (!selected.length) throw new Error("Unsupported host platform; pass --platform explicitly");
const outdir = resolve(options.outdir);
const metadata = {
  version: project.version, description: project.description, license: project.license, author: project.author,
  repository: project.repository, homepage: project.homepage, bugs: project.bugs,
  engines: { node: ">=20" }, publishConfig: { access: "public" },
};
async function files(directory: string) {
  await mkdir(directory, { recursive: true });
  for (const file of ["LICENSE", "README.md", "THIRD_PARTY_NOTICES.txt"]) await cp(file, join(directory, file));
}
for (const platform of selected) {
  const directory = join(outdir, `snipix-${platform.id}`);
  const executable = platform.os === "win32" ? "snipix.exe" : "snipix";
  const source = options.binaries
    ? join(resolve(options.binaries), `snipix-${platform.id}${platform.os === "win32" ? ".exe" : ""}`)
    : resolve("dist", executable);
  if (!await Bun.file(source).exists()) throw new Error(`Missing binary: ${source}. Build it before packaging.`);
  await files(directory);
  await mkdir(join(directory, "bin"), { recursive: true });
  await cp(source, join(directory, "bin", executable));
  await chmod(join(directory, "bin", executable), 0o755);
  await Bun.write(join(directory, "package.json"), JSON.stringify({
    ...metadata, name: `snipix-${platform.id}`, description: `Native ${platform.id} executable for snipix`,
    os: [platform.os], cpu: [platform.cpu], ...("libc" in platform ? { libc: [platform.libc] } : {}),
    files: ["bin", "LICENSE", "README.md", "THIRD_PARTY_NOTICES.txt"],
  }, null, 2) + "\n");
}
const main = join(outdir, "snipix");
await files(main);
await mkdir(join(main, "bin"), { recursive: true });
await cp("bin/snipix.cjs", join(main, "bin/snipix.cjs"));
await chmod(join(main, "bin/snipix.cjs"), 0o755);
await Bun.write(join(main, "package.json"), JSON.stringify({
  ...metadata, name: "snipix", bin: { snipix: "bin/snipix.cjs" },
  keywords: ["cli", "code", "image", "png", "svg", "syntax-highlighting", "ray-so", "bun"],
  files: ["bin", "LICENSE", "README.md", "THIRD_PARTY_NOTICES.txt"],
  optionalDependencies: Object.fromEntries(PLATFORMS.map((platform) => [`snipix-${platform.id}`, project.version])),
}, null, 2) + "\n");
console.log(`Staged snipix@${project.version} and ${selected.length} platform package(s) in ${outdir}. Nothing was published.`);
