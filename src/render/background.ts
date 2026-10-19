import { backgroundData } from "../assets/backgrounds";
import type { RenderOptions } from "../config/options";
import type { Theme } from "../themes";
import type { FrameStyle } from "../themes/frames";
import { color } from "./colors";
import { round } from "./xml";

export async function drawBackground(theme: Theme, frame: FrameStyle, options: RenderOptions, height: number) {
  if (!options.background) return "";
  const width = options.width;
  let result = `<defs><linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color(theme.background.from)}"/><stop offset="1" stop-color="${color(theme.background.to)}"/></linearGradient></defs>`;
  result += `<rect width="${width}" height="${height}" fill="${frame.background ?? "url(#background)"}"/>`;
  const imageKey = options.theme === "resend" ? `resend-${options.darkMode ? "dark" : "light"}` : options.theme;
  if (["noir", "bitmap", "resend-dark", "resend-light", "tailwind"].includes(imageKey)) {
    result += `<image href="${await backgroundData(imageKey)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
  }
  if (options.theme === "ice" || options.theme === "clerk" || options.theme === "triggerdev") {
    result += `<defs><pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="8.5" cy="8.5" r="1" fill="${options.darkMode ? "#fff" : "#000"}" opacity="0.12"/></pattern></defs><rect width="${width}" height="${height}" fill="url(#dots)"/>`;
  }
  if (["gemini", "nuxt"].includes(options.theme)) {
    // Deterministic stars; no random values or runtime assets.
    result += '<g fill="#c5d4ff" opacity="0.35">';
    for (let i = 0; i < 100; i++) result += `<circle cx="${(i * 173 + 29) % width}" cy="${(i * 97 + 41) % height}" r="${i % 3 === 0 ? 1 : 0.5}"/>`;
    result += "</g>";
  }
  if (options.theme === "auth0" || options.theme === "prisma") {
    const accent = frame.accent ?? "#8b66f4";
    result += `<defs><radialGradient id="glow"><stop stop-color="${accent}" stop-opacity="0.45"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${width * 0.3}" cy="${height}" rx="${width * 0.8}" ry="${height}" fill="url(#glow)"/>`;
  }
  if (options.theme === "stripe") result += `<path d="M0 ${round(height * 0.8)} L${width} ${round(height * 0.58)} V${height} H0Z" fill="#f7f9fc"/>`;
  return result;
}
