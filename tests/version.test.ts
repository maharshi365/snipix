import { expect, test } from "bun:test";
import { nextVersion } from "../scripts/version";

test("patch release increments only the patch number", () => {
  expect(nextVersion("1.2.3", "patch")).toBe("1.2.4");
});
test("minor release resets the patch number", () => {
  expect(nextVersion("1.2.3", "minor")).toBe("1.3.0");
});
test("major release resets the minor and patch numbers", () => {
  expect(nextVersion("1.2.3", "major")).toBe("2.0.0");
});
test("release rejects invalid versions and bump kinds", () => {
  expect(() => nextVersion("1.2", "patch")).toThrow("major.minor.patch");
  expect(() => nextVersion("1.2.3-beta.1", "patch")).toThrow("major.minor.patch");
  expect(() => nextVersion("1.2.3", "invalid")).toThrow("release:patch");
});
