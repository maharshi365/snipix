// Native SVG approximations of the upstream frame CSS. Palettes stay upstream.
export interface FrameStyle {
  background?: string;
  panel: string;
  border: string;
  radius: number;
  header: "dots" | "tab" | "none";
  headerHeight: number;
  grid?: boolean;
  accent?: string;
}

export function frameStyle(id: string, dark: boolean): FrameStyle {
  const base: FrameStyle = {
    panel: dark ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.85)",
    border: dark ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.75)",
    radius: 18, header: "dots", headerHeight: 34,
  };
  const solid = (background: string, lightBackground: string, panel: string, lightPanel: string,
    radius: number, header: FrameStyle["header"], grid = false): FrameStyle => ({
    background: dark ? background : lightBackground, panel: dark ? panel : lightPanel,
    border: dark ? "#30333a" : "#d9dce3", radius, header, headerHeight: header === "none" ? 0 : 40, grid,
  });
  switch (id) {
    case "vercel": case "rabbit": return solid("#000", "#fff", "#000", "#fff", 0, "none", true);
    case "aws": return solid("#151d26", "#fff", "#151d26", "#fff", 0, "none", true);
    case "cloudflare": return solid("#0c0c0c", "#f5f5f5", "#0c0c0c", "#fff", 0, "tab", true);
    case "supabase": return { ...solid("#121212", "#f6f6f6", "#171717", "#fff", 6, "tab"), accent: "#3ecf8e" };
    case "tailwind": return solid("#0f172a", "#f1f5f9", "#1e293b", "#fff", 8, "dots", true);
    case "openai": return solid("#121a29", "#f1f0f4", "#232b41", "#fff", 8, "none");
    case "mintlify": return { ...solid("#121212", "#f6f7f6", "#070a08", "#fff", 12, "tab"), accent: dark ? "#55d799" : "#0d9373" };
    case "clerk": return solid("#222", "#f5f5f7", "#191919", "#fff", 8, "none");
    case "elevenlabs": return solid("#111", "#fff", "#111", "#fff", 24, "none", true);
    case "resend": return { ...base, radius: 8, header: "tab", headerHeight: 40, panel: dark ? "rgba(0,0,0,0.88)" : "rgba(255,255,255,0.88)" };
    case "triggerdev": return solid("#121317", "#f7f7f8", "#191a20", "#fff", 0, "tab", true);
    case "nuxt": return { ...solid("#0b0c11", "#f3faf6", "#0b0c11", "#fff", 10, "none"), border: "#00dc82", accent: "#00dc82" };
    case "gemini": return solid("#0e1016", "#f3f5fc", "#16181d", "#fff", 26, "tab");
    case "stripe": return { ...solid("#0a2540", "#0a2540", "#0c2e4e", "#0c2e4e", 8, "none", true), border: "#0f395e" };
    case "browserbase": return { ...solid("#000", "#fafafa", "#0f0f0f", "#fff", 0, "dots", true), accent: "#ff4500" };
    case "firecrawl": return { ...solid("#000", "#fff", "#000", "#fff", 0, "none", true), accent: "#f97316" };
    case "prisma": return { ...solid("#111", "#f6f8f7", "rgba(26,26,26,0.85)", "rgba(255,255,255,0.9)", 12, "tab"), accent: "#01d7e4" };
    case "auth0": return { ...solid("#191919", "#f7f6ff", "#171717", "#fff", 14, "tab", true), accent: "#8b66f4" };
    case "bitmap": case "noir": return { ...base, panel: dark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)" };
    case "ice": return { ...base, background: dark ? "#0e0e0e" : "#f6f6f6" };
    default: return base;
  }
}
