import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const backend = path.join(root, "backend");

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const testUrl = process.env.TEST_DATABASE_URL ?? readEnvFile(path.join(root, ".env.test")).TEST_DATABASE_URL;

if (!testUrl) {
  console.error(
    "\n[setup-db] TEST_DATABASE_URL is not set.\n" +
      "  Copy .env.test.example to .env.test and point it at a DEDICATED test database.\n" +
      "  This script runs `prisma db push` and the demo seed, which DELETES data.\n",
  );
  process.exit(1);
}

function run(args) {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(npx, args, {
    cwd: backend,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("[setup-db] syncing schema to the test database...");
run(["prisma", "db", "push", "--url", testUrl, "--accept-data-loss"]);

console.log("[setup-db] seeding base accounts/services (destructive)...");
run(["tsx", "prisma/seed.ts"]);

console.log("[setup-db] seeding demo data (destructive)...");
run(["tsx", "prisma/seed.demo.ts"]);

console.log("[setup-db] test database ready.");
