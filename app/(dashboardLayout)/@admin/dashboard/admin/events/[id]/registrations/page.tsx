"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type RegistrationItem = {
  id: string;
  status: string;
  registeredAt: string;
  studentId: string | null;
  department: string | null;
  hall: string | null;
  user: { id: string; name: string | null; email: string };
};

const PAGE_SIZE = 10;

export default function AdminEventRegistrationsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = params.id;

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [eventName, setEventName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch event name and registrations in parallel
      const [eventRes, regRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events/${eventId}`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/dashboard/admin/events/${eventId}/registrations`, { credentials: "include" }),
      ]);

      if (eventRes.ok) {
        const payload = (await eventRes.json()) as { data?: { title?: string; name?: string } };
        setEventName(payload.data?.title ?? payload.data?.name ?? "Event");
      }

      if (!regRes.ok) {
        if (regRes.status === 403) setError("Admin access required.");
        else if (regRes.status === 401) setError("Please login first.");
        else setError("Failed to load registrations.");
        return;
      }

      const regPayload = (await regRes.json()) as { data?: RegistrationItem[] };
      setRegistrations(regPayload.data ?? []);
    } catch {
      setError("Unable to connect to backend.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleRemove = async (reg: RegistrationItem) => {
    if (!window.confirm(`Remove "${reg.user.name || reg.user.email}" from this event?`)) return;
    if (busyId) return;
    setBusyId(reg.id);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/registrations/${reg.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok || res.status === 204) {
        setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
        // Reset to last valid page if needed
        setPage((p) => {
          const newTotal = Math.max(1, Math.ceil((registrations.length - 1) / PAGE_SIZE));
          return p > newTotal ? newTotal : p;
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(registrations.length / PAGE_SIZE));
  const paginated = registrations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.back()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Registrations{eventName ? `: ${eventName}` : ""}
          </h1>
          {!isLoading && !error && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {registrations.length} participant{registrations.length !== 1 ? "s" : ""} registered
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading registrations...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isLoading && !error && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registered Participants</CardTitle>
            <CardDescription>Manage who is registered for this event.</CardDescription>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No participants registered for this event yet.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginated.map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between rounded-lg border px-4 py-3 gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {reg.user.name || "Unnamed"}{" "}
                          <span className="font-normal text-muted-foreground text-sm">— {reg.user.email}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Student ID: {reg.studentId ?? "N/A"} &nbsp;|&nbsp; Dept: {reg.department ?? "N/A"} &nbsp;|&nbsp; Hall: {reg.hall ?? "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registered: {new Date(reg.registeredAt).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            hour: "numeric", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${reg.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {reg.status}
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === reg.id}
                          onClick={() => void handleRemove(reg)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, registrations.length)} of {registrations.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
                      <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) =>
                          p === "…" ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
                          ) : (
                            <Button
                              key={p}
                              size="sm"
                              variant={p === page ? "default" : "outline"}
                              onClick={() => setPage(p as number)}
                            >
                              {p}
                            </Button>
                          )
                        )}
                      <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</Button>
                      <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
