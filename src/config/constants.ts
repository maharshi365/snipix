export const PADDING_OPTIONS = [16, 32, 64, 128] as const;
export const SIZE_OPTIONS = [2, 4, 6] as const;
export const FONTS = {
  "jetbrains-mono": "JetBrains Mono",
  "geist-mono": "Geist Mono",
  "ibm-plex-mono": "IBM Plex Mono",
  "fira-code": "Fira Code",
  "roboto-mono": "Roboto Mono",
  "commit-mono": "Commit Mono",
  "space-mono": "Space Mono",
  "source-code-pro": "Source Code Pro",
  "google-sans-code": "Google Sans Code",
} as const;
export const DEFAULTS = {
  theme: "candy", background: true, darkMode: true, padding: 64,
  size: 4, width: 680, fontSize: 15, title: "", subtitle: "",
  language: "auto", format: false, printWidth: 80, tabWidth: 2,
};
