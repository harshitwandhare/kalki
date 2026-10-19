import { describe, expect, it } from "vitest";
import { hasPermission, requireRole } from "@/lib/rbac";

describe("rbac", () => {
  it("lets higher roles act as lower ones", () => {
    expect(hasPermission("OWNER", "EDITOR")).toBe(true);
    expect(hasPermission("EDITOR", "VIEWER")).toBe(true);
  });

  it("blocks lower roles from higher ones", () => {
    expect(hasPermission("VIEWER", "OWNER")).toBe(false);
    expect(hasPermission("EDITOR", "OWNER")).toBe(false);
  });

  it("fails closed on missing or unknown roles", () => {
    expect(requireRole(undefined, "VIEWER")).toBe(false);
    expect(requireRole("ROOT", "VIEWER")).toBe(false);
  });
});
