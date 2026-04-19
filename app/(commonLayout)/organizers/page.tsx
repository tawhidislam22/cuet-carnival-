"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";
import { getAuthSession } from "@/lib/auth-client";

type OrganizerItem = {
  id: string;
  name: string | null;
  email: string;
  organizerClubName: string | null;
  organizerBio: string | null;
  organizerEventType: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  hostedEvents: number;
  totalAttendees: number;
};

export default function OrganizersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizers, setOrganizers] = useState<OrganizerItem[]>([]);

  useEffect(() => {
    async function loadOrganizers() {
      const session = await getAuthSession();

      if (!session?.user) {
        router.replace(`/login?redirect=${encodeURIComponent("/organizers")}`);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/organizers`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent("/organizers")}`);
          return;
        }

        if (!response.ok) {
          setError("Failed to load organizers.");
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | { data?: OrganizerItem[] }
          | null;

        setOrganizers(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setError("Unable to connect to backend.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrganizers();
  }, [router]);

  const sortedOrganizers = useMemo(() => {
    return [...organizers].sort((a, b) => {
      if (b.hostedEvents === a.hostedEvents) {
        return b.totalAttendees - a.totalAttendees;
      }
      return b.hostedEvents - a.hostedEvents;
    });
  }, [organizers]);

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Organizers</h1>
            <p className="mt-2 text-muted-foreground">
              Browse all organizer accounts. This page is available only for logged-in users.
            </p>
          </div>
          <Link href="/events">
            <Button variant="outline">Back to Events</Button>
          </Link>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading organizers...</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!isLoading && !error && sortedOrganizers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No organizers found yet.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedOrganizers.map((organizer) => {
            const initials = (organizer.name || organizer.email)
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("");

            return (
              <Card key={organizer.id}>
                <CardHeader className="pb-3">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                      {initials || "OR"}
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">
                        {organizer.organizerClubName || organizer.name || "Organizer"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{organizer.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {organizer.organizerBio || "No organizer bio provided yet."}
                  </p>
                  <p>
                    <span className="font-medium">Specialty:</span>{" "}
                    {organizer.organizerEventType || "General"}
                  </p>
                  <p>
                    <span className="font-medium">Hosted Events:</span> {organizer.hostedEvents}
                  </p>
                  <p>
                    <span className="font-medium">Total Participants:</span> {organizer.totalAttendees}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {organizer.onboardingCompleted ? "Onboarding complete" : "Onboarding pending"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
