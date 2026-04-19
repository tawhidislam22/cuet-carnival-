"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type Registration = {
  id: string;
  status: string;
  registeredAt: string;
  studentId: string | null;
  department: string | null;
  hall: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
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

export default function EventRegistrationsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Delete confirmation popup
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // Load event title
        const eventRes = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (eventRes.ok) {
          const eventPayload = await eventRes.json();
          setEventTitle(eventPayload?.data?.title ?? "");
        }

        // Load registrations
        const res = await fetch(`${API_BASE_URL}/events/${eventId}/registrations`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(
            res.status === 403
              ? "You do not have permission to view these registrations."
              : payload?.message || "Failed to load registrations."
          );
          return;
        }

        const payload = await res.json();
        setRegistrations(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setError("Unable to connect to backend.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
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
      setDeleteTarget(null);
      // If deleting makes current page empty and not first page, go back
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

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/organizer/manage-events"
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Manage Events
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Registrations</h1>
            {eventTitle ? (
              <p className="mt-0.5 text-muted-foreground text-sm">{eventTitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
              {registrations.length} registered
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Students</CardTitle>
            <CardDescription>All students who registered for this event.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading registrations...</p>
            ) : null}

            {error ? (
              <p className="text-sm text-destructive py-4">{error}</p>
            ) : null}

            {!isLoading && !error && registrations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No registrations yet for this event.
              </div>
            ) : null}

            {!isLoading && !error && registrations.length > 0 ? (
              <>
                {/* Table */}
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
                          <td className="px-4 py-3 text-muted-foreground">
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </td>
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
                              variant="destructive"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(reg);
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
                {totalPages > 1 ? (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Page {page} of {totalPages} &nbsp;·&nbsp; {registrations.length} total
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant={p === page ? "default" : "outline"}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="mx-4 w-full max-w-sm rounded-xl border bg-background shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Remove Registration</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-1">
                Remove <span className="font-medium text-foreground">{deleteTarget.user.name ?? deleteTarget.user.email}</span> from this event?
              </p>
              <p className="text-xs text-muted-foreground">{deleteTarget.user.email}</p>

              {deleteError ? (
                <p className="mt-3 text-sm text-destructive">{deleteError}</p>
              ) : null}
            </div>

            <div className="flex gap-3 border-t px-6 py-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
