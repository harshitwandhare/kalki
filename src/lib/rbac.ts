import { Role } from "@/generated/prisma/client";

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

const roleHierarchy: Record<Role, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
};

// ─── Permission Check ─────────────────────────────────────────────────────────

/**
 * Returns true if `userRole` meets or exceeds the `requiredRole` level.
 *
 * @example
 * hasPermission('OWNER', 'EDITOR')  // true
 * hasPermission('VIEWER', 'OWNER')  // false
 */
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// ─── Role Guard Helper ────────────────────────────────────────────────────────

/**
 * Use in API route handlers to guard against insufficient permissions.
 *
 * @example
 * const session = await auth();
 * const userRole = (session?.user?.role ?? 'VIEWER') as Role;
 * if (!hasPermission(userRole, 'OWNER')) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export function requireRole(
  userRole: Role | string | undefined,
  requiredRole: Role,
): boolean {
  if (!userRole) return false;
  const role = userRole as Role;
  if (!(role in roleHierarchy)) return false;
  return hasPermission(role, requiredRole);
}
