"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";

type EventForm = {
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  imageUrl: string;
  isPublished: boolean;
};

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = params?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    category: "",
    location: "",
    startsAt: "",
    endsAt: "",
    capacity: "",
    imageUrl: "",
    isPublished: false,
  });

  useEffect(() => {
    if (!eventId) return;

    async function loadEvent() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          setLoadError("Failed to load event.");
          return;
        }
        const payload = await res.json();
        const ev = payload?.data;
        setForm({
          title: ev.title ?? "",
          description: ev.description ?? "",
          category: ev.category ?? "",
          location: ev.location ?? "",
          startsAt: toDatetimeLocal(ev.startsAt),
          endsAt: toDatetimeLocal(ev.endsAt),
          capacity: String(ev.capacity ?? ""),
          imageUrl: ev.imageUrl ?? "",
          isPublished: Boolean(ev.isPublished),
        });
      } catch {
        setLoadError("Unable to connect to backend.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadEvent();
  }, [eventId]);

  const handleChange = (field: keyof EventForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSuccess(false);

    if (!form.title.trim() || form.title.length < 3) {
      setSaveError("Title must be at least 3 characters.");
      return;
    }
    if (!form.description.trim() || form.description.length < 10) {
      setSaveError("Description must be at least 10 characters.");
      return;
    }
    if (!form.location.trim()) {
      setSaveError("Location is required.");
      return;
    }
    const cap = parseInt(form.capacity, 10);
    if (!form.capacity || isNaN(cap) || cap < 1) {
      setSaveError("Capacity must be a positive number.");
      return;
    }
    if (!form.startsAt || !form.endsAt) {
      setSaveError("Start and end dates are required.");
      return;
    }
    if (new Date(form.startsAt) >= new Date(form.endsAt)) {
      setSaveError("End date must be after start date.");
      return;
    }

    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "General",
        location: form.location.trim(),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        capacity: cap,
        isPublished: form.isPublished,
      };
      if (form.imageUrl.trim()) body.imageUrl = form.imageUrl.trim();

      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setSaveError(
          res.status === 403
            ? "You are not allowed to edit this event."
            : payload?.message || "Failed to update event."
        );
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/organizer/manage-events"), 1200);
    } catch {
      setSaveError("Unable to connect to backend.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/organizer/manage-events"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Manage Events
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Event</CardTitle>
            <CardDescription>Update the details for this event.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading event details...</p>
            ) : null}

            {loadError ? (
              <p className="text-sm text-destructive py-4">{loadError}</p>
            ) : null}

            {!isLoading && !loadError ? (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Event title"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Event description"
                    rows={4}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    required
                  />
                </div>

                {/* Category + Location */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={form.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      placeholder="e.g. Tech, Cultural, Sports"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      placeholder="e.g. CUET Auditorium"
                      required
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="startsAt">Starts At *</Label>
                    <Input
                      id="startsAt"
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(e) => handleChange("startsAt", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endsAt">Ends At *</Label>
                    <Input
                      id="endsAt"
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={(e) => handleChange("endsAt", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                    placeholder="Max registrations"
                    required
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={(e) => handleChange("imageUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {/* Published toggle */}
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <input
                    id="isPublished"
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => handleChange("isPublished", e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div>
                    <Label htmlFor="isPublished" className="cursor-pointer font-medium">
                      Published
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Published events are visible to all students.
                    </p>
                  </div>
                </div>

                {saveError ? (
                  <p className="text-sm text-destructive">{saveError}</p>
                ) : null}

                {success ? (
                  <p className="text-sm text-green-600 font-medium">
                    Event updated! Redirecting...
                  </p>
                ) : null}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSaving} className="flex-1">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/organizer/manage-events")}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
