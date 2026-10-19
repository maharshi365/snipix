import { Command, Option } from "commander";
import { resolve } from "node:path";
import { generateNotices } from "./notices";

const targets = ["bun-windows-x64", "bun-windows-arm64", "bun-linux-x64", "bun-linux-arm64", "bun-linux-x64-musl", "bun-linux-arm64-musl", "bun-darwin-x64", "bun-darwin-arm64"];
const command = new Command().description("Build one executable with embedded WASM, fonts, themes, and backgrounds")
  .addOption(new Option("--target <target>", "Bun executable target; defaults to this platform").choices(targets))
  .option("--outfile <path>", "output executable path")
  .parse();
const options = command.opts();
const windows = options.target ? options.target.includes("windows") : process.platform === "win32";
const requested = options.outfile ?? `dist/snipix${windows ? ".exe" : ""}`;
const outfile = resolve(windows && !requested.toLowerCase().endsWith(".exe") ? `${requested}.exe` : requested);
await generateNotices();
const result = await Bun.build({
  entrypoints: ["src/cli/index.ts"],
  target: "bun",
  compile: { outfile, ...(options.target ? { target: options.target } : {}), autoloadDotenv: false, autoloadBunfig: false },
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    SNIPIX_NOTICES: JSON.stringify(await Bun.file("THIRD_PARTY_NOTICES.txt").text()),
  },
});
if (!result.success) throw new AggregateError(result.logs, "Executable build failed");
const size = Bun.file(outfile).size;
console.log(`Built ${outfile} (${(size / 1024 / 1024).toFixed(1)} MiB). No runtime dependencies.`);
