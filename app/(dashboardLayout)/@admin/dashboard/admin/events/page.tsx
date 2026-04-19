"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";

type AdminEventItem = {
  id: string;
  name: string;
  category: string;
  date: string;
  status: string;
  seats: number;
  attendees: number;
  organizerName: string;
};

type AdminEventsResponse = {
  generatedAt?: string;
  events: AdminEventItem[];
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
        {filtered !== total ? ` (filtered from ${total} total)` : " events"}
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

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const loadAdminEvents = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/admin/events`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) setError("Admin access required.");
        else if (response.status === 401) setError("Please login first.");
        else setError("Failed to load events.");
        setEvents([]);
        setGeneratedAt(null);
        return;
      }

      const payload = (await response.json()) as { data?: AdminEventsResponse };
      const responseData = payload.data;
      setEvents(responseData?.events ?? []);
      setGeneratedAt(responseData?.generatedAt ?? null);
      setError(null);
    } catch {
      setError("Unable to connect to dashboard service.");
      setEvents([]);
      setGeneratedAt(null);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdminEvents();
    const pollId = window.setInterval(() => void loadAdminEvents(true), 30000);
    const handleWindowFocus = () => void loadAdminEvents(true);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadAdminEvents]);

  const handleTogglePublish = async (event: AdminEventItem) => {
    if (busyId) return;
    setBusyId(event.id);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/admin/events/${event.id}/toggle-publish`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? { ...e, status: e.status === "Published" ? "Draft" : "Published" }
              : e
          )
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (event: AdminEventItem) => {
    if (!window.confirm(`Delete event "${event.name}"? This cannot be undone.`)) return;
    if (busyId) return;
    setBusyId(event.id);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/admin/events/${event.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok || res.status === 204) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleViewRegistrations = (event: AdminEventItem) => {
    router.push(`/dashboard/admin/events/${event.id}/registrations`);
  };

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(events.map((e) => e.category).filter(Boolean)));
    return cats.sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter((e) => {
      if (statusFilter !== "all" && e.status.toLowerCase() !== statusFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (q && !(
        e.name.toLowerCase().includes(q) ||
        e.organizerName.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [events, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = search || statusFilter !== "all" || categoryFilter !== "all";

  const lastSyncedLabel = generatedAt
    ? new Date(generatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, update, and monitor all carnival events.</p>
          {!isLoading && !error && lastSyncedLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">Last synced: {lastSyncedLabel}</p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadAdminEvents()} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Event List</CardTitle>
          <CardDescription>All current and upcoming events.</CardDescription>

          {/* Filters */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
            <Input
              placeholder="Search event name, organizer, category..."
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
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="text-muted-foreground"
                onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }}>
                Clear filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading events...</p>
          ) : (
            <>
              <div className="space-y-3">
                {paginated.map((event) => (
                <div key={event.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.category} • {formatDate(event.date)}</p>
                      <p className="text-xs text-muted-foreground">Organizer: {event.organizerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${event.status === "Published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {event.status}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {event.attendees}/{event.seats} seats
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === event.id}
                      onClick={() => void handleTogglePublish(event)}
                    >
                      {event.status === "Published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewRegistrations(event)}
                    >
                      Registrations ({event.attendees})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === event.id}
                      onClick={() => void handleDelete(event)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
                {filtered.length === 0 && (
                  <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                    {hasActiveFilters ? "No events match your filters." : "No events found."}
                  </div>
                )}
              </div>

              <Paginator
                page={page}
                totalPages={totalPages}
                total={events.length}
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