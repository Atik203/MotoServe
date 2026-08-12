import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "motoserve_token";
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];
const ROLE_HOME: Record<string, string> = {
  owner: "/dashboard",
  advisor: "/advisor",
  mechanic: "/mechanic",
  admin: "/admin",
};

function decodeRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string };
    return data.role?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!token) {
    if (!isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const role = decodeRole(token);

  if (isAuthPage) {
    const home = role && ROLE_HOME[role];
    if (home) return NextResponse.redirect(new URL(home, request.url));
    return NextResponse.next();
  }

  for (const [guardRole, prefix] of Object.entries(ROLE_HOME)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (role !== guardRole) {
        const home = role && ROLE_HOME[role];
        return NextResponse.redirect(new URL(home ?? "/login", request.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/advisor/:path*",
    "/mechanic/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/login/:path*",
    "/register/:path*",
    "/forgot-password/:path*",
  ],
};
