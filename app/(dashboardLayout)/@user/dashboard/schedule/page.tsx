"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ScheduleItem = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  endsAt: string;
  category: string;
  registrationStatus: string;
};

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/schedule`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          setError(response.status === 401 ? "Please login first." : "Failed to load schedule.");
          return;
        }

        const payload = await response.json();
        setItems(Array.isArray(payload.data) ? payload.data : []);
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
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground">Upcoming events in your calendar.</p>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : null}
        {error ? <p className="text-destructive">{error}</p> : null}

        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>Start: {new Date(item.startsAt).toLocaleString()}</p>
                <p>End: {new Date(item.endsAt).toLocaleString()}</p>
                <p>Location: {item.location}</p>
                <p>Status: {item.registrationStatus}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && !error && items.length === 0 ? (
          <p className="text-muted-foreground">No upcoming schedule found.</p>
        ) : null}
      </div>
    </div>
  );
}
