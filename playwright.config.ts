import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readEnvFile(file: string): Record<string, string> {
  if (!existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const testEnv = readEnvFile(path.join(ROOT, ".env.test"));
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? testEnv.TEST_DATABASE_URL ?? "";
const API_ORIGIN = process.env.TEST_API_ORIGIN ?? "http://localhost:4000";
const WEB_BASE = process.env.TEST_WEB_URL ?? "http://localhost:3000";

if (!TEST_DATABASE_URL) {
  throw new Error(
    "\n[playwright] TEST_DATABASE_URL is not set.\n" +
      "  Copy .env.test.example to .env.test and point it at a DEDICATED test database.\n" +
      "  The suite reseeds that database (it deletes data) — never use your dev database.\n",
  );
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: WEB_BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev --prefix backend",
      url: `${API_ORIGIN}/api/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL } as Record<string, string>,
    },
    {
      command: "npm run build --prefix frontend && npm run start --prefix frontend",
      url: WEB_BASE,
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
