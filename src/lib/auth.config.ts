import type { NextAuthConfig } from "next-auth";

// ─── Edge-compatible auth config (no Prisma / Node.js imports) ───────────────
// Used by middleware (Edge Runtime). The full credentials provider is only
// added in auth.ts which runs in the Node.js runtime.

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [],
  callbacks: {
    // Always allow sign-in — PENDING/REJECTED handled by middleware routing.
    signIn() {
      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as Record<string, unknown>).role =
          (user as Record<string, unknown>).role ?? "VIEWER";
        (token as Record<string, unknown>).status =
          (user as Record<string, unknown>).status ?? "ACTIVE";
      }
      return token;
    },

    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role =
          ((token as Record<string, unknown>).role as string) ?? "VIEWER";
        session.user.status =
          ((token as Record<string, unknown>).status as string) ?? "ACTIVE";
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
