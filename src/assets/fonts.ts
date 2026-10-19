// File imports are embedded by `bun build --compile`.
import jetbrains from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff" with { type: "file" };
import geist from "@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff" with { type: "file" };
import ibm from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff" with { type: "file" };
import fira from "@fontsource/fira-code/files/fira-code-latin-400-normal.woff" with { type: "file" };
import roboto from "@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff" with { type: "file" };
import commit from "@fontsource/commit-mono/files/commit-mono-latin-400-normal.woff" with { type: "file" };
import space from "@fontsource/space-mono/files/space-mono-latin-400-normal.woff" with { type: "file" };
import source from "@fontsource/source-code-pro/files/source-code-pro-latin-400-normal.woff" with { type: "file" };
import google from "@fontsource/google-sans-code/files/google-sans-code-latin-400-normal.woff" with { type: "file" };
import inter from "@fontsource/inter/files/inter-latin-500-normal.woff" with { type: "file" };
import extended from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-ext-500-normal.woff" with { type: "file" };
import greek from "@fontsource/jetbrains-mono/files/jetbrains-mono-greek-500-normal.woff" with { type: "file" };
import cyrillic from "@fontsource/jetbrains-mono/files/jetbrains-mono-cyrillic-500-normal.woff" with { type: "file" };
import cyrillicExt from "@fontsource/jetbrains-mono/files/jetbrains-mono-cyrillic-ext-500-normal.woff" with { type: "file" };

export const FONT_FILES: Record<string, string> = {
  "jetbrains-mono": jetbrains, "geist-mono": geist, "ibm-plex-mono": ibm,
  "fira-code": fira, "roboto-mono": roboto, "commit-mono": commit,
  "space-mono": space, "source-code-pro": source, "google-sans-code": google, inter,
};
export const FALLBACK_FILES = [extended, greek, cyrillic, cyrillicExt];
