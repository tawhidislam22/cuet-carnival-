"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type OrganizerEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  isPublished: boolean;
};

type Registration = {
  id: string;
  status: string;
  registeredAt: string;
  certificateIssuedAt: string | null;
  studentId: string | null;
  department: string | null;
  hall: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

const PAGE_SIZE = 10;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Paginator({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>
        Showing {start}–{end} of {total}
      </span>
      {totalPages > 1 && (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function OrganizerCertificatesPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(`${API_BASE_URL}/events/mine`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          setError("Failed to load your events.");
          return;
        }
        const payload = await res.json();
        const list: OrganizerEvent[] = Array.isArray(payload?.data) ? payload.data : [];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0].id);
      } catch {
        setError("Unable to connect to backend.");
      } finally {
        setLoadingEvents(false);
      }
    }
    void loadEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingRegs(true);
    setRegistrations([]);
    setPage(1);

    async function loadRegistrations() {
      try {
        const res = await fetch(`${API_BASE_URL}/events/${selectedEventId}/registrations`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          setError("Failed to load registrations.");
          return;
        }
        const payload = await res.json();
        setRegistrations(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setError("Unable to load registrations.");
      } finally {
        setLoadingRegs(false);
      }
    }
    void loadRegistrations();
  }, [selectedEventId]);

  async function handleIssueCertificate(regId: string) {
    setActionLoading(regId);
    try {
      const res = await fetch(
        `${API_BASE_URL}/events/${selectedEventId}/registrations/${regId}/certificate`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) {
        alert("Failed to give certificate.");
        return;
      }
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId ? { ...r, certificateIssuedAt: new Date().toISOString() } : r
        )
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevokeCertificate(regId: string) {
    if (!confirm("Revoke this certificate? The student will no longer be able to view or download it.")) return;
    setActionLoading(regId);
    try {
      const res = await fetch(
        `${API_BASE_URL}/events/${selectedEventId}/registrations/${regId}/certificate`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        alert("Failed to revoke certificate.");
        return;
      }
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, certificateIssuedAt: null } : r))
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filteredRegs = registrations.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.user.name.toLowerCase().includes(q) ||
      r.user.email.toLowerCase().includes(q) ||
      (r.studentId ?? "").toLowerCase().includes(q) ||
      (r.department ?? "").toLowerCase().includes(q) ||
      (r.hall ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRegs.length / PAGE_SIZE));
  const paged = filteredRegs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const issuedCount = registrations.filter((r) => r.certificateIssuedAt !== null).length;

  if (loadingEvents) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading events…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-1 text-muted-foreground">
            Select an event and give participation certificates to registered students.
          </p>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              You have not created any events yet.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Event Selector */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                  {selectedEvent && (
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(selectedEvent.startsAt)} · {selectedEvent.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            {!loadingRegs && registrations.length > 0 && (
              <div className="mb-4 flex gap-4 text-sm">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary font-medium">
                  {registrations.length} registered
                </span>
                <span className={`rounded-full px-3 py-1 font-medium ${
                  issuedCount > 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {issuedCount} certificate{issuedCount !== 1 ? "s" : ""} given
                </span>
              </div>
            )}

            {/* Search */}
            {!loadingRegs && registrations.length > 0 && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name, email, student ID, department, or hall…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {/* Registrations Table */}
            <Card>
              <CardContent className="p-0">
                {loadingRegs ? (
                  <div className="py-16 text-center text-muted-foreground">Loading registrations…</div>
                ) : registrations.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    No registrations found for this event.
                  </div>
                ) : filteredRegs.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    No students match your search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium">Student</th>
                          <th className="px-4 py-3 text-left font-medium">Student ID</th>
                          <th className="px-4 py-3 text-left font-medium">Dept / Hall</th>
                          <th className="px-4 py-3 text-left font-medium">Registered</th>
                          <th className="px-4 py-3 text-left font-medium">Certificate</th>
                          <th className="px-4 py-3 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((reg) => (
                          <tr key={reg.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="font-medium">{reg.user.name}</div>
                              <div className="text-muted-foreground text-xs">{reg.user.email}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {reg.studentId ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <div>{reg.department ?? "—"}</div>
                              <div className="text-xs">{reg.hall ?? ""}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(reg.registeredAt)}
                            </td>
                            <td className="px-4 py-3">
                              {reg.certificateIssuedAt ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Given {formatDate(reg.certificateIssuedAt)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  Not given
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {reg.certificateIssuedAt ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  disabled={actionLoading === reg.id}
                                  onClick={() => handleRevokeCertificate(reg.id)}
                                >
                                  {actionLoading === reg.id ? "Revoking…" : "Revoke"}
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={actionLoading === reg.id}
                                  onClick={() => handleIssueCertificate(reg.id)}
                                >
                                  {actionLoading === reg.id ? "Giving…" : "Give Certificate"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 pb-4">
                      <Paginator
                        total={filteredRegs.length}
                        page={page}
                        pageSize={PAGE_SIZE}
                        onPage={(p) => {
                          setPage(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
