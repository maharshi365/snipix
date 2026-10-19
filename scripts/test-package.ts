// Verify what npm actually ships, using only local tarballs and no registry access.
import { strict as assert } from "node:assert";
import { mkdir, mkdtemp } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import project from "../package.json";
import { hostPlatform } from "./platforms";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const root = resolve("dist/npm");
const temporary = process.platform === "win32" && process.env.LOCALAPPDATA
  ? join(process.env.LOCALAPPDATA, "Temp", "opencode") : tmpdir();
await mkdir(temporary, { recursive: true });
const directory = await mkdtemp(join(temporary, "snipix-npm-"));
const tarballs = join(directory, "tarballs");
await mkdir(tarballs);
async function run(command: string[], cwd: string) {
  const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, status] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  assert.equal(status, 0, stderr || stdout);
  return stdout;
}
for (const name of ["snipix", `snipix-${hostPlatform()}`]) {
  const packed = JSON.parse(await run([npm, "pack", "--json", "--pack-destination", tarballs], join(root, name)))[0];
  for (const file of packed.files) {
    assert.match(file.path, /^(package\.json|README\.md|LICENSE|THIRD_PARTY_NOTICES\.txt|bin\/[^/]+)$/);
  }
  if (name === "snipix") {
    assert.ok(packed.unpackedSize < 1_000_000, "Launcher must not contain binaries or source dependencies");
    const manifest = await Bun.file(join(root, name, "package.json")).json();
    assert.equal(manifest.dependencies, undefined);
    assert.equal(Object.keys(manifest.optionalDependencies).length, 8);
  }
}
const installation = join(directory, "consumer");
await mkdir(installation);
await Bun.write(join(installation, "package.json"), '{"name":"snipix-smoke-test","private":true}\n');
await run([npm, "install", "--offline", "--ignore-scripts", "--omit=optional", "--package-lock=false", "--no-audit", "--no-fund",
  join(tarballs, `snipix-${hostPlatform()}-${project.version}.tgz`), join(tarballs, `snipix-${project.version}.tgz`)], installation);
const launcher = join(installation, "node_modules/snipix/bin/snipix.cjs");
assert.match(await run(["node", launcher, "--version"], installation), new RegExp(project.version.replaceAll(".", "\\.")));
const svg = await run(["node", launcher, "render", "--code", "const x=1", "-l", "typescript", "--format", "--type", "svg", "-o", "-"], installation);
assert.match(svg, /<desc>const x = 1;<\/desc>/);
console.log(`npm tarball and installed-launcher smoke tests passed: ${directory}`);
