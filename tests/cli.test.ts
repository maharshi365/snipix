import { expect, test } from "bun:test";

async function cli(args: string[], stdin?: string) {
  const process = Bun.spawn(["bun", "src/cli/index.ts", ...args], {
    stdin: stdin === undefined ? "ignore" : new Blob([stdin]), stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, exit] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
  return { stdout, stderr, exit };
}

test("agent discovery and render help do not need a browser", async () => {
  const options = await cli(["options", "--json"]);
  expect(options.exit).toBe(0);
  expect(JSON.parse(options.stdout).exports).toEqual(["png", "svg"]);
  const help = await cli(["render", "--help"]);
  expect(help.stdout).toContain("--no-background");
  expect(help.stdout).toContain("--format");
});

test("invalid requests exit nonzero without polluting stdout", async () => {
  const result = await cli(["render", "--code", "x", "--theme", "missing", "--json"]);
  expect(result.exit).toBe(1);
  expect(result.stdout).toBe("");
  expect(JSON.parse(result.stderr).error).toContain("Unknown theme");
});

test("stdin renders SVG directly to stdout without status text", async () => {
  const result = await cli(["render", "-", "-l", "typescript", "--format", "--type", "svg", "-o", "-"], "const value=1");
  expect(result.exit).toBe(0);
  expect(result.stdout).toStartWith("<svg");
  expect(result.stdout).toContain("value");
  expect(result.stderr).toBe("");
}, 60000);

test("Python formatting is wired through the CLI", async () => {
  const result = await cli(["render", "--code", "x={ 'a':1}", "-l", "python", "--format", "--type", "svg", "-o", "-"]);
  expect(result.exit).toBe(0);
  expect(result.stdout).toContain("<svg");
  expect(result.stdout).toContain("&quot;a&quot;");
}, 60000);
