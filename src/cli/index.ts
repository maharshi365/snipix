#!/usr/bin/env bun
import { createProgram } from "./command";

try {
  await createProgram().parseAsync(process.argv);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(process.argv.includes("--json") ? JSON.stringify({ error: message }) : `Error: ${message}`);
  process.exitCode = 1;
}
