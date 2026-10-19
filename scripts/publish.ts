// Deliberately small: bun run publish:patch | publish:minor | publish:major.
import { join } from "node:path";
import { PLATFORMS, hostPlatform } from "./platforms";

const bump = process.argv[2];
if (!["patch", "minor", "major"].includes(bump)) throw new Error("Use bun run publish:patch, publish:minor, or publish:major");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
async function run(args: string[], capture = false) {
  const child = Bun.spawn(args, { stdout: capture ? "pipe" : "inherit", stderr: "inherit", stdin: "inherit" });
  const text = capture ? await new Response(child.stdout).text() : "";
  if (await child.exited !== 0) throw new Error(`Command failed: ${args.join(" ")}`);
  return text.trim();
}
if (await run(["git", "status", "--porcelain"], true)) throw new Error("Commit your changes before publishing");
await run([npm, "whoami"]); // Fail before bumping if npm login is missing.
await run(["git", "remote", "get-url", "origin"]);
await run(["bun", "run", "typecheck"]);
await run(["bun", "test"]);
await run([npm, "version", bump, "--no-git-tag-version", "--ignore-scripts"]);
await run(["bun", "install", "--lockfile-only", "--ignore-scripts"]);

for (const platform of PLATFORMS) {
  const outfile = join("dist/binaries", `snipix-${platform.id}${platform.os === "win32" ? ".exe" : ""}`);
  await run(["bun", "scripts/build.ts", "--target", platform.target, "--outfile", outfile]);
}
await run(["bun", "scripts/package.ts", "--all", "--binaries", "dist/binaries"]);
const native = PLATFORMS.find((platform) => platform.id === hostPlatform())!;
await run(["bun", "scripts/test-executable.ts", join("dist/binaries", `snipix-${native.id}${native.os === "win32" ? ".exe" : ""}`)]);
await run(["bun", "scripts/test-package.ts"]);
// Publish platform packages first, so the launcher never points at missing binaries.
for (const name of [...PLATFORMS.map((platform) => `snipix-${platform.id}`), "snipix"]) {
  await run([npm, "publish", join("dist/npm", name), "--access", "public"]);
}
const { version } = await Bun.file("package.json").json();
await run(["git", "add", "package.json", "bun.lock"]);
await run(["git", "commit", "-m", `chore(release): v${version}`, "-m", "Bump the CLI and npm package versions. Build and publish the platform executables before the snipix launcher."]);
await run(["git", "tag", "-a", `v${version}`, "-m", `snipix v${version}`]);
await run(["git", "push", "origin", "HEAD", "--follow-tags"]);
console.log(`Published snipix@${version}. GitHub will attach standalone executables to the release.`);
