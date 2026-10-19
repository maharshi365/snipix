export function nextVersion(version: string, bump: string) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Release version must use major.minor.patch");
  const [major, minor, patch] = version.split(".").map(Number);
  switch (bump) {
    case "patch": return `${major}.${minor}.${patch + 1}`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "major": return `${major + 1}.0.0`;
    default: throw new Error("Use bun run release:patch, release:minor, or release:major");
  }
}
