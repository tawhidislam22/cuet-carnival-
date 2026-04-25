"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AdminUsersPage() {
  const [participants, setParticipants] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
            <p className="mt-1 text-muted-foreground">Review participant activity, status, and enrollment details.</p>
            {isLoading ? <p className="mt-2 text-sm text-muted-foreground">Loading participants...</p> : null}
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void loadAdminUsers()} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Participant Directory</CardTitle>
            <CardDescription>Latest participant records from registration data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.map((user) => (
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
              {!isLoading && !error && participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participant records found.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
