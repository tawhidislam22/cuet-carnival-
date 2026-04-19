"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function Paginator({
  page,
  totalPages,
  total,
  filtered,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  filtered: number;
  onPage: (p: number) => void;
}) {
  const start = filtered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filtered);
  return (
    <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{start}–{end}</span> of{" "}
        <span className="font-medium">{filtered}</span>
        {filtered !== total ? ` (filtered from ${total} total)` : " registrations"}
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
                <Button
                  key={p}
                  size="sm"
                  variant={p === page ? "default" : "outline"}
                  onClick={() => onPage(p as number)}
                >
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

export default function EventRegistrationsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = params.id;

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [eventName, setEventName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventRes, regRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events/${eventId}`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/events/${eventId}/registrations`, { credentials: "include" }),
      ]);

      if (eventRes.ok) {
        const payload = (await eventRes.json()) as { data?: { title?: string; name?: string } };
        setEventName(payload.data?.title ?? payload.data?.name ?? "Event");
      }

      if (!regRes.ok) {
        if (regRes.status === 401) setError("Please log in to view registrations.");
        else if (regRes.status === 403) setError("You are not the organizer of this event.");
        else setError("Failed to load registrations.");
        return;
      }

      const regPayload = (await regRes.json()) as { data?: RegistrationItem[] };
      setRegistrations(regPayload.data ?? []);
    } catch {
      setError("Unable to connect to the backend.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void loadData(); }, [loadData]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return registrations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q && !(
        (r.user.name ?? "").toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q) ||
        (r.studentId ?? "").toLowerCase().includes(q) ||
        (r.department ?? "").toLowerCase().includes(q) ||
        (r.hall ?? "").toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [registrations, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = search || statusFilter !== "all";

  const handleRemove = async (reg: RegistrationItem) => {
    if (busyId) return;
    if (!window.confirm(`Remove "${reg.user.name || reg.user.email}" from this event?`)) return;
    setBusyId(reg.id);
    try {
      const res = await fetch(
        `${API_BASE_URL}/events/${eventId}/registrations/${reg.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok || res.status === 204) {
        setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
        setPage((p) => {
          const newTotal = Math.max(1, Math.ceil((registrations.length - 1) / PAGE_SIZE));
          return p > newTotal ? newTotal : p;
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="container mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href={`/events/${eventId}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Event
            </Link>
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

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading registrations...</p>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Registered Participants</CardTitle>
              <CardDescription>Manage who is registered for your event.</CardDescription>

              {/* Filters */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
                <Input
                  placeholder="Search name, email, student ID, dept, hall..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="sm:max-w-xs"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {paginated.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {reg.user.name || "Unnamed"}{" "}
                        <span className="font-normal text-muted-foreground text-sm">
                          — {reg.user.email}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Student ID: {reg.studentId ?? "N/A"} &nbsp;|&nbsp;
                        Dept: {reg.department ?? "N/A"} &nbsp;|&nbsp;
                        Hall: {reg.hall ?? "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registered:{" "}
                        {new Date(reg.registeredAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          reg.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
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

                {filtered.length === 0 && (
                  <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "No registrations match your filters."
                      : "No participants have registered for this event yet."}
                  </div>
                )}
              </div>

              <Paginator
                page={page}
                totalPages={totalPages}
                total={registrations.length}
                filtered={filtered.length}
                onPage={setPage}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
