"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type RegistrationItem = {
  id: string;
  status: string;
  registeredAt: string;
  studentId: string | null;
  department: string | null;
  hall: string | null;
  user: { id: string; name: string | null; email: string };
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [registrationsModal, setRegistrationsModal] = useState<{ eventId: string; eventName: string; list: RegistrationItem[] } | null>(null);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);

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

  const handleViewRegistrations = async (event: AdminEventItem) => {
    setRegistrationsLoading(true);
    setRegistrationsModal({ eventId: event.id, eventName: event.name, list: [] });
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/admin/events/${event.id}/registrations`, {
        credentials: "include",
      });
      if (res.ok) {
        const payload = (await res.json()) as { data?: RegistrationItem[] };
        setRegistrationsModal({ eventId: event.id, eventName: event.name, list: payload.data ?? [] });
      }
    } finally {
      setRegistrationsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
            <p className="mt-1 text-muted-foreground">Create, update, and monitor all carnival events.</p>
            {isLoading ? <p className="mt-2 text-sm text-muted-foreground">Loading events...</p> : null}
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
            {!isLoading && !error && lastSyncedLabel ? (
              <p className="mt-2 text-xs text-muted-foreground">Live API sync: {lastSyncedLabel}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void loadAdminEvents()} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event List</CardTitle>
            <CardDescription>All current and upcoming events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
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
                      onClick={() => void handleViewRegistrations(event)}
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
              {!isLoading && !error && events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events found.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Modal */}
      {registrationsModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setRegistrationsModal(null); }}
        >
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border bg-background shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Registrations: {registrationsModal.eventName}</h2>
                <Button size="sm" variant="outline" onClick={() => setRegistrationsModal(null)}>Close</Button>
              </div>
              {registrationsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : registrationsModal.list.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registrations yet.</p>
              ) : (
                <div className="space-y-2">
                  {registrationsModal.list.map((reg) => (
                    <div key={reg.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{reg.user.name || "Unnamed"} — <span className="text-muted-foreground">{reg.user.email}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {reg.studentId ?? "N/A"} | Dept: {reg.department ?? "N/A"} | Hall: {reg.hall ?? "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">Registered: {new Date(reg.registeredAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


