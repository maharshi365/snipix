import { parse, formatRgb } from "culori";

export function color(value: string | undefined, fallback = "#ffffff") {
  if (!value) return fallback;
  const parsed = parse(value.trim());
  return parsed ? formatRgb(parsed) : fallback;
}
export function tokenColor(value: string | undefined, variables: Record<string, string>, fallback: string) {
  if (!value) return fallback;
  const variable = /^var\((--[\w-]+)(?:,\s*(.*))?\)$/.exec(value);
  return color(variable ? variables[variable[1]] ?? variable[2] : value, fallback);
}
