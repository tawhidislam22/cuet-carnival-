"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MyEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  imageUrl: string | null;
  category: string;
  status: string;
  eventStatus: string;
};

export default function MyEventsPage() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/my-events`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          setError(response.status === 401 ? "Please login first." : "Failed to load events.");
          return;
        }

        const payload = await response.json();
        setEvents(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setError("Unable to connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-muted-foreground">All events you have registered for.</p>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : null}
        {error ? <p className="text-destructive">{error}</p> : null}

        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  {new Date(event.startsAt).toLocaleString()} - {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <div className="text-right text-sm">
                    <p className="font-medium">Registration: {event.status}</p>
                    <p className="text-muted-foreground">Event: {event.eventStatus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && !error && events.length === 0 ? (
          <p className="text-muted-foreground">No events registered yet.</p>
        ) : null}
      </div>
    </div>
  );
}
