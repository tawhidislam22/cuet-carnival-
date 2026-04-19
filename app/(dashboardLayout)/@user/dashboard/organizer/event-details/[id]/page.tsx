"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type EventDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  isPublished: boolean;
  imageUrl: string | null;
  attendees: number;
  organizer: { id: string; name: string | null; email: string };
};

type Registration = {
  id: string;
  status: string;
  registeredAt: string;
  studentId: string | null;
  department: string | null;
  hall: string | null;
  user: { id: string; name: string | null; email: string };
};

const PAGE_SIZE = 10;

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveImageUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  if (raw.startsWith("/uploads")) return `${API_BASE_URL.replace("/api", "")}${raw}`;
  return raw;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Delete popup
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [eventRes, regsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/events/${eventId}`, { credentials: "include", cache: "no-store" }),
          fetch(`${API_BASE_URL}/events/${eventId}/registrations`, { credentials: "include", cache: "no-store" }),
        ]);

        if (!eventRes.ok) {
          setError(eventRes.status === 404 ? "Event not found." : "Failed to load event.");
          return;
        }

        const eventPayload = await eventRes.json();
        setEvent(eventPayload?.data ?? null);

        if (regsRes.ok) {
          const regsPayload = await regsRes.json();
          setRegistrations(Array.isArray(regsPayload?.data) ? regsPayload.data : []);
        }
      } catch {
        setError("Unable to connect to backend.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [eventId]);

  const totalPages = Math.max(1, Math.ceil(registrations.length / PAGE_SIZE));
  const paginated = registrations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmDelete = async () => {
    if (!deleteTarget || !eventId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/events/${eventId}/registrations/${deleteTarget.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setDeleteError(payload?.message || "Failed to remove registration.");
        return;
      }
      setRegistrations((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setEvent((prev) => (prev ? { ...prev, attendees: prev.attendees - 1 } : prev));
      setDeleteTarget(null);
      setPage((p) => {
        const newTotal = Math.max(1, Math.ceil((registrations.length - 1) / PAGE_SIZE));
        return p > newTotal ? newTotal : p;
      });
    } catch {
      setDeleteError("Unable to remove registration.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive mb-3">{error ?? "Event not found."}</p>
          <Link href="/dashboard/organizer/event-details" className="text-sm text-primary hover:underline">
            Back to Event Details
          </Link>
        </div>
      </div>
    );
  }

  const fillPct = Math.min(Math.round((event.attendees / Math.max(event.capacity, 1)) * 100), 100);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Back link */}
        <Link
          href="/dashboard/organizer/event-details"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Event Details
        </Link>

        {/* Event details card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              {/* Image */}
              <div className="h-48 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-64">
                {event.imageUrl ? (
                  <img
                    src={resolveImageUrl(event.imageUrl)}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-start gap-3">
                  <h1 className="text-2xl font-bold leading-tight flex-1">{event.title}</h1>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      event.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {event.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>

                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <Detail label="Category" value={event.category} />
                  <Detail label="Location" value={event.location} />
                  <Detail label="Starts" value={formatDate(event.startsAt)} />
                  <Detail label="Ends" value={formatDate(event.endsAt)} />
                  <Detail label="Capacity" value={`${event.capacity} seats`} />
                  <Detail label="Registrations" value={`${event.attendees} / ${event.capacity} (${fillPct}% full)`} />
                </div>

                {/* Fill bar */}
                <div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/events/${event.id}`} target="_blank">View Public Page</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/organizer/update-events/${event.id}`}>Edit Event</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Registered Students</CardTitle>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {registrations.length} registered
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No students have registered for this event yet.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Student ID</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Dept.</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Hall</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Registered</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((reg, idx) => (
                        <tr key={reg.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                          <td className="px-4 py-3 font-medium">{reg.user.name ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{reg.user.email}</td>
                          <td className="px-4 py-3">{reg.studentId ?? "—"}</td>
                          <td className="px-4 py-3">{reg.department ?? "—"}</td>
                          <td className="px-4 py-3">{reg.hall ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                reg.status === "Confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {reg.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(reg.registeredAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setDeleteTarget(reg);
                                setDeleteError(null);
                              }}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Remove Registration</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.user.name ?? deleteTarget.user.email}
              </span>{" "}
              from this event? This action cannot be undone.
            </p>

            {deleteError && (
              <p className="mt-3 text-sm text-destructive">{deleteError}</p>
            )}

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={isDeleting}
                onClick={confirmDelete}
              >
                {isDeleting ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
