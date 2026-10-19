// Smoke-test a single copied executable, outside the project and without Bun/Node on PATH.
import { cp, mkdir, mkdtemp, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { strict as assert } from "node:assert";

const binary = resolve(process.argv[2] ?? `dist/snipix${process.platform === "win32" ? ".exe" : ""}`);
if (!await Bun.file(binary).exists()) throw new Error("Build the executable first: bun run build");
const temporary = process.platform === "win32" && process.env.LOCALAPPDATA
  ? join(process.env.LOCALAPPDATA, "Temp", "opencode") : tmpdir();
await mkdir(temporary, { recursive: true });
const directory = await mkdtemp(join(temporary, "snipix-standalone-"));
const executable = join(directory, process.platform === "win32" ? "snipix.exe" : "snipix");
await cp(binary, executable);
async function run(args: string[], stdin?: string) {
  const child = Bun.spawn([executable, ...args], {
    cwd: directory,
    env: { ...process.env, PATH: "", BUN_OPTIONS: "", NODE_PATH: "" },
    stdin: stdin === undefined ? "ignore" : new Blob([stdin]), stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, status] = await Promise.all([
    new Response(child.stdout).arrayBuffer(), new Response(child.stderr).text(), child.exited,
  ]);
  assert.equal(status, 0, stderr);
  return { bytes: Buffer.from(stdout), stderr };
}

const help = await run(["render", "--help"]);
assert.match(help.bytes.toString(), /No browser/);
const discovery = await run(["themes", "--json"]);
assert.equal(JSON.parse(discovery.bytes.toString()).length, 33);
const licenses = await run(["licenses"]);
assert.match(licenses.bytes.toString(), /Raycast/);
const svg = await run(["render", "-", "-l", "typescript", "--format", "--type", "svg", "-o", "-"], "const x=1");
assert.match(svg.bytes.toString(), /<desc>const x = 1;<\/desc>/);
assert.doesNotMatch(svg.bytes.toString(), /foreignObject/);
assert.equal(svg.stderr, "");
const python = await run(["render", "--code", "x={ 'a':1}", "-l", "python", "--format", "--type", "svg", "-o", "-"]);
assert.match(python.bytes.toString(), /x = \{&quot;a&quot;: 1\}/);
const png = await run(["render", "--code", "const x=1", "-l", "javascript", "--theme", "noir", "--size", "2x", "-o", "-", "--type", "png"]);
assert.equal(png.bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
assert.equal(png.stderr, "");
// Cedar and Tailwind have custom upstream grammars/themes, not just bundled Shiki IDs.
const cedar = await run(["render", "--code", "permit(principal, action, resource);", "-l", "cedar", "--theme", "tailwind", "--type", "svg", "-o", "-"]);
assert.match(cedar.bytes.toString(), /data-frame="tailwind"/);
assert.equal((await readdir(directory)).length, 1, "The executable must not extract dependencies or create runtime files");
console.log(`Standalone smoke tests passed: ${directory}`);
