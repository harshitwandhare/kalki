import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// ─── Next.js App Router Middleware ───────────────────────────────────────────
// Uses auth.config.ts (no Prisma) — safe for Edge Runtime.

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  // Not authenticated → redirect to sign in
  if (!session) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated but PENDING → redirect to pending page
  if (session.user?.status === "PENDING") {
    return NextResponse.redirect(new URL("/auth/pending", nextUrl.origin));
  }

  // Authenticated but REJECTED → redirect to rejected page
  if (session.user?.status === "REJECTED") {
    return NextResponse.redirect(new URL("/auth/rejected", nextUrl.origin));
  }

  // Admin routes require OWNER role (string comparison — no Prisma import needed)
  if (nextUrl.pathname.startsWith("/admin") && session.user?.role !== "OWNER") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Settings route requires OWNER role
  if (nextUrl.pathname === "/settings" && session.user?.role !== "OWNER") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

// ─── Route Matcher ────────────────────────────────────────────────────────────
// Covers every URL served by the (dashboard) route group.
// NOTE: (dashboard) is a layout group — it does NOT prefix URLs.
// Pages at src/app/(dashboard)/generate/page.tsx are accessible at /generate.

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/generate",
    "/channels/:path*",
    "/library",
    "/agents",
    "/settings",
    "/admin/:path*",
    "/characters",
    "/worlds",
  ],
};
