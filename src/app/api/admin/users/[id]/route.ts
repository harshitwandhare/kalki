import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { Role, UserStatus } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!requireRole(session?.user?.role, Role.OWNER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, role } = body as { status?: string; role?: string };

  // Prevent super-admin from demoting themselves
  if (id === session?.user?.id && role && role !== "OWNER") {
    return NextResponse.json(
      { error: "Cannot change your own role." },
      { status: 400 },
    );
  }

  const validStatuses = ["PENDING", "ACTIVE", "REJECTED"] as const;
  const validRoles = ["OWNER", "EDITOR", "VIEWER"] as const;

  if (status && !validStatuses.includes(status as UserStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (role && !validRoles.includes(role as Role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(status && { status: status as UserStatus }),
      ...(role && { role: role as Role }),
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!requireRole(session?.user?.role, Role.OWNER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session?.user?.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account." },
      { status: 400 },
    );
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
