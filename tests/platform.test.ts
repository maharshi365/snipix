import { expect, test } from "bun:test";
import { createRequire } from "node:module";
import { PLATFORMS } from "../scripts/platforms";

const { platformId } = createRequire(import.meta.url)("../bin/snipix.cjs");
test("launcher selects the published platform package for every supported target", () => {
  for (const platform of PLATFORMS) {
    expect(platformId(platform.os, platform.cpu, !("libc" in platform) || platform.libc === "glibc" ? "2.39" : undefined))
      .toBe(platform.id);
  }
});
test.each([["win32", "ia32"], ["freebsd", "x64"]])("unsupported target %s/%s fails clearly", (os, cpu) => {
  expect(() => platformId(os, cpu)).toThrow("does not support");
});
