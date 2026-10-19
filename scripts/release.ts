// Bump, check, and tag. GitHub Actions builds and publishes the executables.
import { nextVersion } from "./version";

const project = await Bun.file("package.json").json();
const version = nextVersion(project.version, process.argv[2]);
async function run(args: string[], capture = false) {
  const child = Bun.spawn(args, { stdout: capture ? "pipe" : "inherit", stderr: "inherit", stdin: "inherit" });
  const text = capture ? await new Response(child.stdout).text() : "";
  if (await child.exited !== 0) throw new Error(`Command failed: ${args.join(" ")}`);
  return text.trim();
}
if (await run(["git", "status", "--porcelain"], true)) throw new Error("Commit your changes before releasing");
await run(["gh", "auth", "status"]);
await run(["git", "remote", "get-url", "origin"]);
await run(["bun", "run", "typecheck"]);
await run(["bun", "test"]);
// Replace only the version field; leave the rest of the manifest unchanged.
const manifest = await Bun.file("package.json").text();
await Bun.write("package.json", manifest.replace(/("version"\s*:\s*)"[^"]+"/, `$1"${version}"`));
await run(["bun", "run", "build"]);
await run(["bun", "run", "test:executable"]);
await run(["git", "add", "package.json"]);
await run(["git", "commit", "-m", `chore(release): v${version}`, "-m", "Bump the CLI version and trigger GitHub's standalone executable release workflow."]);
await run(["git", "tag", "-a", `v${version}`, "-m", `snipix v${version}`]);
await run(["git", "push", "origin", "HEAD", "--follow-tags"]);
console.log(`Tagged v${version}. GitHub Actions will publish the standalone release.`);
