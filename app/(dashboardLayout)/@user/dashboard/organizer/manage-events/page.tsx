"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type OrganizerEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  isPublished: boolean;
  status: string;
  attendees: number;
  capacity: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ManageOrganizerEventsPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/events/mine`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setError(response.status === 401 ? "Please login first." : "Failed to load organizer events.");
        return;
      }

      const payload = await response.json();
      setEvents(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setError("Unable to connect to backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleTogglePublish = async (event: OrganizerEvent) => {
    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/events/${event.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublished: !event.isPublished,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message || "Failed to update event publication status.");
        return;
      }

      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id ? { ...item, isPublished: !event.isPublished } : item
        )
      );
    } catch {
      setError("Unable to update event right now.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this event?");
    if (!confirmed) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message || "Failed to delete event.");
        return;
      }

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch {
      setError("Unable to delete event right now.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
            <p className="mt-1 text-muted-foreground">
              Maintain your events, control publication, and track registrations.
            </p>
          </div>
          <Link href="/dashboard/organizer/create-event">
            <Button>Create Another Event</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Maintenance Board</CardTitle>
            <CardDescription>All organizer-owned events loaded in real time.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading events...</p> : null}
            {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

            {!isLoading && !error && events.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No events found. Create an event to get started.
              </div>
            ) : null}

            <div className="space-y-4">
              {events.map((event) => {
                const completion = `${Math.min(
                  Math.round((event.attendees / Math.max(event.capacity, 1)) * 100),
                  100
                )}% full`;

                const isCompleted = event.status === "Completed";

                return (
                  <div key={event.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link
                          href={`/dashboard/organizer/manage-events/${event.id}`}
                          className="font-semibold hover:text-primary hover:underline transition-colors"
                        >
                          {event.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.startsAt)} • {event.location} • {completion}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            isCompleted
                              ? "bg-gray-100 text-gray-600"
                              : event.isPublished
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {isCompleted ? "Completed" : event.isPublished ? "Published" : "Draft"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Regs: {event.attendees}/{event.capacity}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/events/${event.id}`}>View Event</Link>
                      </Button>
                      {!isCompleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => handleTogglePublish(event)}
                        >
                          {event.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                      )}
                      {!isCompleted && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/organizer/update-events/${event.id}`}>Edit</Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isBusy}
                        onClick={() => handleDelete(event.id)}
                      >
                        Delete Event
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
