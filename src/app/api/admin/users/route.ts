import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { Role } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!requireRole(session?.user?.role, Role.OWNER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}
