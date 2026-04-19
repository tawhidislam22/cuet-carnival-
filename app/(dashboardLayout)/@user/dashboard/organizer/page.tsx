"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type OrganizerEvent = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  isPublished: boolean;
  attendees: number;
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

export default function OrganizerDashboardPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
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
    }

    void loadEvents();
  }, []);

  const stats = useMemo(() => {
    const totalCreated = events.length;
    const totalPublished = events.filter((event) => event.isPublished).length;
    const totalRegistrations = events.reduce((sum, event) => sum + event.attendees, 0);
    const totalDrafts = totalCreated - totalPublished;

    return [
      { label: "Total Created Events", value: String(totalCreated) },
      { label: "Published Events", value: String(totalPublished) },
      { label: "Total Registrations", value: String(totalRegistrations) },
      { label: "Draft Events", value: String(totalDrafts) },
    ];
  }, [events]);

  const previewEvents = useMemo(() => {
    return events.slice(0, 5);
  }, [events]);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Create your events, monitor registrations, and manage operations from one place.
            </p>
          </div>
          <Link href="/dashboard/organizer/create-event">
            <Button>Create New Event</Button>
          </Link>
        </div>

        {isLoading ? <p className="mb-6 text-sm text-muted-foreground">Loading organizer data...</p> : null}
        {error ? <p className="mb-6 text-sm text-destructive">{error}</p> : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>My Event Portfolio</CardTitle>
                <CardDescription>Live overview of events you are managing.</CardDescription>
              </div>
              <Link href="/dashboard/organizer/manage-events">
                <Button variant="outline" size="sm">Manage All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!isLoading && !error && previewEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No events created yet. Start by creating your first event.
              </div>
            ) : (
              <div className="space-y-3">
                {previewEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.startsAt)} • {event.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            event.isPublished
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {event.isPublished ? "Published" : "Draft"}
                        </span>
                        <span className="text-muted-foreground">Regs: {event.attendees}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
