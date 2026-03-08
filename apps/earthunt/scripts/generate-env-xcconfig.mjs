#!/usr/bin/env node
/**
 * Reads .env and .env.local from the app root and writes ios/Env.xcconfig
 * with NEXT_PUBLIC_* variables so Xcode build can use them.
 * Run from app root (e.g. earthunt).
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const iosDir = join(appRoot, "ios");
const outputPath = join(iosDir, "Env.xcconfig");

const PREFIX = "NEXT_PUBLIC_";

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf-8");
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"'))
      value = value.slice(1, -1).replace(/\\"/g, '"');
    else if (value.startsWith("'") && value.endsWith("'"))
      value = value.slice(1, -1).replace(/\\'/g, "'");
    out[key] = value;
  }
  return out;
}

function escapeXcconfigValue(value) {
  if (value === "") return '""';
  if (/[\s=#\\]/.test(value) || value.includes('"'))
    return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return value;
}

const env = {
  ...parseEnvFile(join(appRoot, ".env")),
  ...parseEnvFile(join(appRoot, ".env.local")),
};

const entries = Object.entries(env)
  .filter(([key]) => key.startsWith(PREFIX))
  .sort(([a], [b]) => a.localeCompare(b));

const lines = [
  "// Generated from .env / .env.local — do not edit by hand.",
  "// Only NEXT_PUBLIC_* variables are included.",
  "",
  ...entries.map(
    ([key, value]) => `${key} = ${escapeXcconfigValue(value)}`
  ),
  "",
];

writeFileSync(outputPath, lines.join("\n"), "utf-8");
