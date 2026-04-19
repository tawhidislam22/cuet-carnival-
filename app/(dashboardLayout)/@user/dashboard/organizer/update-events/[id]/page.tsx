"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  isPublished: boolean;
};

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function resolveImageUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  if (raw.startsWith("/uploads")) return `${API_BASE_URL.replace("/api", "")}${raw}`;
  return raw;
}

export default function UpdateEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = params?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    category: "",
    location: "",
    startsAt: "",
    endsAt: "",
    capacity: "",
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
          isPublished: Boolean(ev.isPublished),
        });
        const resolved = resolveImageUrl(ev.imageUrl);
        setCurrentImageUrl(resolved);
        setImagePreview(resolved);
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

  // Handle local image preview before upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleUploadImage = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setImageError("Please choose an image file first.");
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setImageError(
          res.status === 403
            ? "You are not allowed to change this event's image."
            : payload?.message || "Image upload failed."
        );
        return;
      }

      const payload = await res.json();
      const newUrl = resolveImageUrl(payload?.data?.imageUrl);
      setCurrentImageUrl(newUrl);
      setImagePreview(newUrl);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setImageError("Unable to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
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
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category.trim() || "General",
          location: form.location.trim(),
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          capacity: cap,
          isPublished: form.isPublished,
        }),
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
      setTimeout(() => router.push("/dashboard/organizer/update-events"), 1200);
    } catch {
      setSaveError("Unable to connect to backend.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Back link */}
      <Link
        href="/dashboard/organizer/update-events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Update Events
      </Link>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading event details...
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {loadError}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
            {/* Image upload card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Image</CardTitle>
                <CardDescription>Upload a new image for this event.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview */}
                <div className="relative h-40 w-full overflow-hidden rounded-lg border bg-muted">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* File picker + upload button */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label
                    htmlFor="imageFile"
                    className="flex-1 cursor-pointer rounded-md border border-dashed px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors text-center"
                  >
                    {fileInputRef.current?.files?.[0]?.name ?? "Choose image (JPG, PNG, WebP — max 5 MB)"}
                    <input
                      id="imageFile"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      className="sr-only"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingImage}
                    onClick={() => void handleUploadImage()}
                    className="shrink-0"
                  >
                    {isUploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>

                {imageError ? (
                  <p className="text-sm text-destructive">{imageError}</p>
                ) : null}
                {!imageError && currentImageUrl !== imagePreview ? (
                  <p className="text-xs text-amber-600">
                    Preview updated — click &quot;Upload Image&quot; to save it.
                  </p>
                ) : null}
                {currentImageUrl === imagePreview && currentImageUrl ? (
                  <p className="text-xs text-green-600">Image saved.</p>
                ) : null}
              </CardContent>
            </Card>

            {/* Event details card */}
            <Card>
              <CardHeader>
                <CardTitle>Edit Event Details</CardTitle>
                <CardDescription>Update the information for this event.</CardDescription>
              </CardHeader>
              <CardContent>
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
                      onClick={() => router.push("/dashboard/organizer/update-events")}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}
