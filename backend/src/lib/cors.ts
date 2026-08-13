const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:3500")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) return true;
  return origin.endsWith(".vercel.app");
}
