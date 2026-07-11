import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const publicPaths = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await verifySessionToken(token);
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const roleRoutes: Record<string, string[]> = {
    "/products": ["ADMIN", "WAREHOUSE"],
    "/categories": ["ADMIN", "WAREHOUSE"],
    "/lots": ["ADMIN", "WAREHOUSE"],
    "/suppliers": ["ADMIN", "WAREHOUSE"],
    "/stock": ["ADMIN", "WAREHOUSE"],
    "/customers": ["ADMIN", "SELLER"],
    "/sales": ["ADMIN", "SELLER"],
    "/credit": ["ADMIN", "SELLER"],
    "/reports": ["ADMIN"],
    "/admin": ["ADMIN"],
  };

  for (const [prefix, roles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(prefix) && !roles.includes(user.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
