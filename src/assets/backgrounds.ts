import noir from "../../vendor/ray-so/assets/distortion.png" with { type: "file" };
import bitmap from "../../vendor/ray-so/assets/manifesto.png" with { type: "file" };
import resendDark from "../../vendor/ray-so/assets/resend/resend-pattern-dark.png" with { type: "file" };
import resendLight from "../../vendor/ray-so/assets/resend/resend-pattern-light.png" with { type: "file" };
import beams from "../../vendor/ray-so/assets/tailwind/beams.png" with { type: "file" };

export const BACKGROUND_FILES: Record<string, string> = { noir, bitmap, "resend-dark": resendDark, "resend-light": resendLight, tailwind: beams };
const cache = new Map<string, Promise<string>>();
export function backgroundData(key: string) {
  if (!cache.has(key)) cache.set(key, Bun.file(BACKGROUND_FILES[key]).arrayBuffer()
    .then((bytes) => `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`));
  return cache.get(key)!;
}
