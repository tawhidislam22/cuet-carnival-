"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  imageUrl?: string | null;
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

export default function EventDetailsListPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/events/mine`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          setError(res.status === 401 ? "Please login first." : "Failed to load events.");
          return;
        }
        const payload = await res.json();
        setEvents(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setError("Unable to connect to backend.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Event Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select an event to view details, registrations, and manage participants.
        </p>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading events...
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isLoading && !error && events.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">You have not created any events yet.</p>
          <Link href="/dashboard/organizer/create-event" className="text-sm text-primary font-medium hover:underline">
            Create your first event
          </Link>
        </div>
      )}

      {/* Event list */}
      {!isLoading && !error && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => {
            const imageUrl = event.imageUrl
              ? event.imageUrl.startsWith("/uploads")
                ? `${API_BASE_URL.replace("/api", "")}${event.imageUrl}`
                : event.imageUrl
              : null;
            const fillPct = Math.min(Math.round((event.attendees / Math.max(event.capacity, 1)) * 100), 100);
            const isCompleted = event.status === "Completed";

            return (
              <Link
                key={event.id}
                href={`/dashboard/organizer/event-details/${event.id}`}
                className="group flex items-center gap-4 rounded-xl border bg-background px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Thumbnail */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {imageUrl ? (
                    <img src={imageUrl} alt={event.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="w-5 h-5 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isCompleted
                          ? "bg-gray-100 text-gray-600"
                          : event.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isCompleted ? "Completed" : event.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDate(event.startsAt)} · {event.location}
                  </p>
                  {/* Mini fill bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {event.attendees}/{event.capacity}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
