#!/usr/bin/env node
"use strict";

const { existsSync } = require("node:fs");
const { dirname, join } = require("node:path");
const { spawnSync } = require("node:child_process");

function platformId(platform, arch, glibc) {
  if (!["win32", "darwin", "linux"].includes(platform) || !["x64", "arm64"].includes(arch)) {
    throw new Error(`snipix does not support ${platform}/${arch}. See https://github.com/maharshi365/snipix`);
  }
  return `${platform}-${arch}${platform === "linux" && !glibc ? "-musl" : ""}`;
}

function resolveBinary() {
  const glibc = process.platform === "linux" && process.report.getReport().header.glibcVersionRuntime;
  const id = platformId(process.platform, process.arch, glibc);
  const filename = process.platform === "win32" ? "snipix.exe" : "snipix";
  const packageName = `snipix-${id}`;
  try {
    const directory = dirname(require.resolve(`${packageName}/package.json`));
    const binary = join(directory, "bin", filename);
    if (existsSync(binary)) return binary;
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
  }
  // `bun link` in the private source workspace can use a local build.
  if (require("../package.json").private) {
    const binary = join(__dirname, "..", "dist", filename);
    if (existsSync(binary)) return binary;
  }
  throw new Error(`Missing ${packageName}. Reinstall with optional dependencies enabled:\n  npm install -g snipix --include=optional\nOr download the standalone executable from https://github.com/maharshi365/snipix/releases`);
}

function main() {
  try {
    const child = spawnSync(resolveBinary(), process.argv.slice(2), { stdio: "inherit", windowsHide: true });
    if (child.error) throw child.error;
    if (child.signal) {
      process.kill(process.pid, child.signal);
      return;
    }
    process.exitCode = child.status ?? 1;
  } catch (error) {
    console.error(`snipix: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { platformId, resolveBinary };
if (require.main === module) main();
