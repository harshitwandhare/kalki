import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/client";

type AuthedSession = Session & { user: { id: string } };

type Guard =
  { ok: true; session: AuthedSession } | { ok: false; response: NextResponse };

/** Route-handler guard: signed in, approved, and at least `min` role. */
export async function guard(min: Role): Promise<Guard> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      ),
    };
  }
  if (
    session.user.status !== "ACTIVE" ||
    !requireRole(session.user.role, min)
  ) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, session: session as AuthedSession };
}
