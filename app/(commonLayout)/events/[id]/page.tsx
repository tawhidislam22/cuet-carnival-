"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type EventDetails = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  category: string;
  status: string;
  imageUrl: string | null;
  attendees: number;
  capacity: number;
  organizer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

function formatDate(date: string) {
  const parsed = new Date(date);
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventDetailsPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        setEvent(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          setEvent(null);
          return;
        }

        const payload = await response.json();
        setEvent(payload?.data ?? null);
      } catch {
        setEvent(null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadEvent();
  }, [eventId]);

  const handleRegister = async () => {
    if (!eventId || isRegistering) {
      return;
    }

    setIsRegistering(true);
    setRegisterMessage(null);
    setRegisterError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRegisterError(payload?.message || "Registration failed");
        return;
      }

      setRegisterMessage(payload?.message || "Registered successfully");
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              attendees: prev.attendees + 1,
            }
          : prev
      );
    } catch {
      setRegisterError("Something went wrong. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="min-h-screen px-4 py-10">
        <div className="container mx-auto max-w-5xl space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground">Loading event details...</p>
          ) : null}

          {!isLoading && !event ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Event not found</h1>
              <p className="text-muted-foreground">
                This event may have been removed or is unavailable right now.
              </p>
              <Button asChild>
                <Link href="/events">Back to all events</Link>
              </Button>
            </div>
          ) : null}

          {!isLoading && event ? (
            <>
              <div className="flex items-center justify-between">
                <Link
                  href="/events"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Back to all events
                </Link>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {event.status}
                </span>
              </div>

              <Card className="overflow-hidden">
                <div className="relative h-72 w-full overflow-hidden md:h-96">
                  <img
                    src={
                      event.imageUrl ||
                      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&q=80"
                    }
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground">
                      {event.category}
                    </span>
                  </div>
                </div>

                <CardHeader className="space-y-3">
                  <CardTitle className="text-3xl md:text-4xl">{event.title}</CardTitle>
                  <p className="text-muted-foreground">{event.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs text-muted-foreground">Start</p>
                      <p className="text-sm font-semibold">{formatDate(event.startsAt)}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs text-muted-foreground">End</p>
                      <p className="text-sm font-semibold">{formatDate(event.endsAt)}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-4 md:col-span-2">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-semibold">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Organizer</p>
                      <p className="text-sm font-semibold">
                        {event.organizer?.name || event.organizer?.email || "Campus Organizer"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.attendees}/{event.capacity} registered
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="sm:w-auto"
                      onClick={handleRegister}
                      disabled={isRegistering}
                    >
                      {isRegistering ? "Registering..." : "Register Now"}
                    </Button>
                    <Button asChild variant="outline" className="sm:w-auto">
                      <Link href="/events">Browse More Events</Link>
                    </Button>
                  </div>

                  {registerMessage ? (
                    <p className="text-sm font-medium text-green-600">{registerMessage}</p>
                  ) : null}
                  {registerError ? (
                    <p className="text-sm font-medium text-red-600">{registerError}</p>
                  ) : null}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </PrivateRoute>
  );
}
