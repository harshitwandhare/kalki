"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/30",
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/30",
};

const roleColor: Record<string, string> = {
  OWNER: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  EDITOR: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  VIEWER: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
      setLoading(false);
    })();
  }, []);

  async function updateUser(
    id: string,
    patch: { status?: string; role?: string },
  ) {
    setSaving(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)),
      );
    }
    setSaving(null);
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setSaving(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
    setSaving(null);
  }

  const pending = users.filter((u) => u.status === "PENDING");
  const others = users.filter((u) => u.status !== "PENDING");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Approve or reject access requests, manage roles.
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading users...</p>
      ) : (
        <>
          {/* Pending approvals */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-3">
                Pending Approval ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    saving={saving === u.id}
                    onUpdate={updateUser}
                    onDelete={deleteUser}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All other users */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              All Users ({others.length})
            </h2>
            <div className="space-y-2">
              {others.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  saving={saving === u.id}
                  onUpdate={updateUser}
                  onDelete={deleteUser}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function UserRow({
  user,
  saving,
  onUpdate,
  onDelete,
}: {
  user: User;
  saving: boolean;
  onUpdate: (id: string, patch: { status?: string; role?: string }) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium text-white shrink-0">
        {(user.name ?? user.email)[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {user.name ?? "—"}
        </p>
        <p className="text-xs text-zinc-400 truncate">{user.email}</p>
      </div>

      {/* Badges */}
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${statusColor[user.status] ?? ""}`}
      >
        {user.status}
      </Badge>
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${roleColor[user.role] ?? ""}`}
      >
        {user.role}
      </Badge>

      {/* Status control — OWNER is always ACTIVE, no change needed */}
      {user.role !== "OWNER" && (
        <Select
          value={user.status}
          onValueChange={(v: string) => onUpdate(user.id, { status: v })}
          disabled={saving}
        >
          <SelectTrigger className="w-32 h-8 text-xs bg-zinc-800 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="PENDING" className="text-yellow-400 text-xs">
              Pending
            </SelectItem>
            <SelectItem value="ACTIVE" className="text-green-400 text-xs">
              Approve
            </SelectItem>
            <SelectItem value="REJECTED" className="text-red-400 text-xs">
              Reject
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Role control */}
      <Select
        value={user.role}
        onValueChange={(v: string) => onUpdate(user.id, { role: v })}
        disabled={saving || user.role === "OWNER"}
      >
        <SelectTrigger className="w-28 h-8 text-xs bg-zinc-800 border-zinc-700 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-700">
          <SelectItem value="OWNER" className="text-orange-400 text-xs">
            Owner
          </SelectItem>
          <SelectItem value="EDITOR" className="text-blue-400 text-xs">
            Editor
          </SelectItem>
          <SelectItem value="VIEWER" className="text-zinc-400 text-xs">
            Viewer
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Delete */}
      {user.role !== "OWNER" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-2 shrink-0"
          disabled={saving}
          onClick={() => onDelete(user.id)}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
