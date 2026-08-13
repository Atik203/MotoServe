const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:3500")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
  if (!origin) {
    callback(null, true);
    return;
  }
  const allow =
    allowedOrigins.includes(origin) ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1") ||
    origin.endsWith(".vercel.app");
  callback(null, allow);
}
