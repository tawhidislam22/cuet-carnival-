"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";

type AdminUserItem = {
  id: string;
  name: string | null;
  email: string;
  dept: string | null;
  studentId: string | null;
  role: string;
  events: number;
  status: string;
};

const PAGE_SIZE = 10;

function Paginator({ page, totalPages, total, filtered, onPage }: {
  page: number; totalPages: number; total: number; filtered: number; onPage: (p: number) => void;
}) {
  const start = filtered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filtered);
  return (
    <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{start}–{end}</span> of{" "}
        <span className="font-medium">{filtered}</span>
        {filtered !== total ? ` (filtered from ${total} total)` : " participants"}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => onPage(1)}>«</Button>
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => onPage(page - 1)}>‹</Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`el-${i}`} className="px-1.5 text-muted-foreground select-none">…</span>
              ) : (
                <Button key={p} size="sm" variant={p === page ? "default" : "outline"} onClick={() => onPage(p as number)}>
                  {p}
                </Button>
              )
            )}
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</Button>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => onPage(totalPages)}>»</Button>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [participants, setParticipants] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const loadAdminUsers = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/admin/users`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) setError("Admin access required.");
        else if (response.status === 401) setError("Please login first.");
        else setError("Failed to load participants.");
        setParticipants([]);
        return;
      }

      const payload = (await response.json()) as { data?: AdminUserItem[] };
      setParticipants(payload.data ?? []);
      setError(null);
    } catch {
      setError("Unable to connect to dashboard service.");
      setParticipants([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdminUsers();
    const pollId = window.setInterval(() => void loadAdminUsers(true), 30000);
    const handleWindowFocus = () => void loadAdminUsers(true);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadAdminUsers]);

  const handleSuspend = async (user: AdminUserItem) => {
    if (busyId) return;
    const action = user.status === "Active" ? "Suspend" : "Activate";
    if (!window.confirm(`${action} user "${user.name || user.email}"?`)) return;
    setBusyId(user.id);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/admin/users/${user.id}/suspend`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setParticipants((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, status: u.status === "Active" ? "Unverified" : "Active" }
              : u
          )
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: AdminUserItem) => {
    if (!window.confirm(`Permanently delete user "${user.name || user.email}"? This cannot be undone.`)) return;
    if (busyId) return;
    setBusyId(user.id);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok || res.status === 204) {
        setParticipants((prev) => prev.filter((u) => u.id !== user.id));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeRole = async (user: AdminUserItem) => {
    const newRole = user.role === "organizer" ? "user" : "organizer";
    if (!window.confirm(`Change role of "${user.name || user.email}" to "${newRole}"?`)) return;
    if (busyId) return;
    setBusyId(user.id);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/admin/users/${user.id}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setParticipants((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return participants.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && u.status !== "Active") return false;
      if (statusFilter === "suspended" && u.status === "Active") return false;
      if (q && !(
        (u.name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.studentId ?? "").toLowerCase().includes(q) ||
        (u.dept ?? "").toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [participants, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = search || roleFilter !== "all" || statusFilter !== "all";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review participant activity, status, and enrollment details.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadAdminUsers()} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Participant Directory</CardTitle>
            <CardDescription>Latest participant records from registration data.</CardDescription>

            {/* Filters */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
              <Input
                placeholder="Search name, email, student ID, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:max-w-xs"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Roles</option>
                <option value="user">Student</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              {hasActiveFilters && (
                <Button size="sm" variant="ghost" className="text-muted-foreground"
                  onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}>
                  Clear filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading participants...</p>
            ) : (
              <>
            <div className="space-y-3">
              {paginated.map((user) => (
                <div key={user.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{user.name || "Unnamed User"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.dept || "N/A"} • {user.studentId || "No Student ID"}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Events: {user.events}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{user.role}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.status === "Active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === user.id}
                      onClick={() => void handleChangeRole(user)}
                    >
                      Make {user.role === "organizer" ? "Student" : "Organizer"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === user.id}
                      onClick={() => void handleSuspend(user)}
                    >
                      {user.status === "Active" ? "Suspend" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === user.id}
                      onClick={() => void handleDelete(user)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                  {hasActiveFilters ? "No participants match your filters." : "No participant records found."}
                </div>
              )}
            </div>

              <Paginator
                page={page}
                totalPages={totalPages}
                total={participants.length}
                filtered={filtered.length}
                onPage={setPage}
              />
              </>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
