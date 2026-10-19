import catalog from "./catalog.json";

export interface Theme {
  id: string;
  name: string;
  background: { from: string; to: string };
  font?: string;
  partner?: boolean;
  lineNumbers?: boolean;
  syntax: { light?: Record<string, string>; dark?: Record<string, string> };
}
export const THEMES = catalog as Record<string, Theme>;
