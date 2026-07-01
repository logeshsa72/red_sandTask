// frontend/src/middleware.js
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/properties/create", "/properties/edit"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("refreshToken");

  // Treat /properties/<id>/edit as protected too (dynamic segment),
  // alongside the static /properties/create route.
  const isProtected =
    protectedRoutes.some((r) => pathname.startsWith(r)) ||
    /^\/properties\/[^/]+\/edit/.test(pathname);
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
  }

  if (isAuthRoute && token && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
