const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:3500")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  // Vercel preview deployments are only trusted outside of production.
  if (process.env.NODE_ENV !== "production" && origin.endsWith(".vercel.app")) {
    callback(null, true);
    return;
  }
  callback(null, false);
}
