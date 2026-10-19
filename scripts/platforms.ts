export const PLATFORMS = [
  { id: "win32-x64", target: "bun-windows-x64", os: "win32", cpu: "x64" },
  { id: "win32-arm64", target: "bun-windows-arm64", os: "win32", cpu: "arm64" },
  { id: "darwin-x64", target: "bun-darwin-x64", os: "darwin", cpu: "x64" },
  { id: "darwin-arm64", target: "bun-darwin-arm64", os: "darwin", cpu: "arm64" },
  { id: "linux-x64", target: "bun-linux-x64", os: "linux", cpu: "x64", libc: "glibc" },
  { id: "linux-arm64", target: "bun-linux-arm64", os: "linux", cpu: "arm64", libc: "glibc" },
  { id: "linux-x64-musl", target: "bun-linux-x64-musl", os: "linux", cpu: "x64", libc: "musl" },
  { id: "linux-arm64-musl", target: "bun-linux-arm64-musl", os: "linux", cpu: "arm64", libc: "musl" },
] as const;

export function hostPlatform() {
  if (process.platform !== "linux") return `${process.platform}-${process.arch}`;
  const report = process.report?.getReport() as { header?: { glibcVersionRuntime?: string } };
  return `linux-${process.arch}${report?.header?.glibcVersionRuntime ? "" : "-musl"}`;
}
