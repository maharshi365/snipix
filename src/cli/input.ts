export async function readCode(file: string | undefined, inline: string | undefined) {
  if (file && inline !== undefined) throw new Error("Use a file or --code, not both");
  let code: string;
  if (inline !== undefined) code = inline;
  else if (file && file !== "-") code = await Bun.file(file).text();
  else {
    if (process.stdin.isTTY) throw new Error("Provide a file, --code, or piped stdin. Run snipix --help");
    code = await Bun.stdin.text();
  }
  if (!code.trim()) throw new Error("Input code is empty");
  if (Buffer.byteLength(code) > 128 * 1024) throw new Error("Input exceeds 128 KiB; select a smaller snippet");
  return code.replace(/\r\n?/g, "\n").replace(/\n$/, "");
}
