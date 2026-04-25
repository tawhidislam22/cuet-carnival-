"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

function parseApiMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string") {
    return message;
  }

  return null;
}

async function uploadToImgBB(file: File): Promise<string> {
  if (!IMGBB_API_KEY) throw new Error("ImgBB API key not configured");
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Image upload failed");
  const json = (await res.json()) as { data?: { url?: string } };
  const url = json?.data?.url;
  if (!url) throw new Error("Image upload failed: no URL returned");
  return url;
}

export default function CreateOrganizerEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [capacity, setCapacity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submittingMode, setSubmittingMode] = useState<"publish" | "draft" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const submitEvent = async (publishNow: boolean) => {
    setError(null);
    setSuccess(null);

    if (
      !title.trim() ||
      !category.trim() ||
      !description.trim() ||
      !venue.trim() ||
      !eventDate ||
      !startTime ||
      !endTime ||
      !capacity
    ) {
      setError("Please fill all event fields.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Description should be at least 10 characters.");
      return;
    }

    const parsedCapacity = Number(capacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
      setError("Capacity must be a positive whole number.");
      return;
    }

    const startsAt = new Date(`${eventDate}T${startTime}`);
    const endsAt = new Date(`${eventDate}T${endTime}`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Please provide valid date and times.");
      return;
    }

    if (endsAt <= startsAt) {
      setError("End time must be after start time.");
      return;
    }

    setSubmittingMode(publishNow ? "publish" : "draft");

    let imageUrl: string | null = null;

    if (imageFile) {
      setIsUploadingImage(true);
      try {
        imageUrl = await uploadToImgBB(imageFile);
      } catch {
        setError("Image upload failed. Please try again or submit without an image.");
        setSubmittingMode(null);
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          location: venue.trim(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          capacity: parsedCapacity,
          isPublished: publishNow,
          imageUrl,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(parseApiMessage(payload) || "Failed to create event.");
        return;
      }

      setSuccess(publishNow ? "Event published successfully." : "Draft saved successfully.");
      router.push("/dashboard/organizer/manage-events");
      router.refresh();
    } catch {
      setError("Unable to connect to backend.");
    } finally {
      setSubmittingMode(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
          <p className="mt-1 text-muted-foreground">
            Submit a new event proposal for CUET Carnival participants.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
            <CardDescription>
              Fill out the details required to publish your event. Drafts remain visible only in your organizer dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitEvent(true);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input
                    id="eventTitle"
                    placeholder="Enter event name"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Tech, Cultural, Workshop..."
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSeats">Maximum Seats</Label>
                  <Input
                    id="maxSeats"
                    type="number"
                    min="1"
                    placeholder="e.g. 200"
                    value={capacity}
                    onChange={(event) => setCapacity(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    placeholder="Event venue"
                    value={venue}
                    onChange={(event) => setVenue(event.target.value)}
                  />
                </div>

                {/* ImgBB Image Upload */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Event Banner Image</Label>
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-6 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 rounded-md object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Click to upload event banner</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  {imageFile ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Selected: {imageFile.name}</p>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  {isUploadingImage ? (
                    <p className="text-xs text-muted-foreground">Uploading image...</p>
                  ) : null}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Describe event goals, rules, and agenda"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {success ? <p className="text-sm text-green-600">{success}</p> : null}
              <p className="text-xs text-muted-foreground">
                Only published events appear on Home and Events pages. Save as draft if you want to publish later.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submittingMode !== null || isUploadingImage}>
                  {submittingMode === "publish" ? "Publishing..." : "Publish Event"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submittingMode !== null || isUploadingImage}
                  onClick={() => void submitEvent(false)}
                >
                  {submittingMode === "draft" ? "Saving..." : "Save as Draft"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function parseApiMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string") {
    return message;
  }

  return null;
}

export default function CreateOrganizerEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [capacity, setCapacity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submittingMode, setSubmittingMode] = useState<"publish" | "draft" | null>(null);

  const submitEvent = async (publishNow: boolean) => {
    setError(null);
    setSuccess(null);

    if (
      !title.trim() ||
      !category.trim() ||
      !description.trim() ||
      !venue.trim() ||
      !eventDate ||
      !startTime ||
      !endTime ||
      !capacity
    ) {
      setError("Please fill all event fields.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Description should be at least 10 characters.");
      return;
    }

    const parsedCapacity = Number(capacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
      setError("Capacity must be a positive whole number.");
      return;
    }

    const startsAt = new Date(`${eventDate}T${startTime}`);
    const endsAt = new Date(`${eventDate}T${endTime}`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Please provide valid date and times.");
      return;
    }

    if (endsAt <= startsAt) {
      setError("End time must be after start time.");
      return;
    }

    setSubmittingMode(publishNow ? "publish" : "draft");

    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          location: venue.trim(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          capacity: parsedCapacity,
          isPublished: publishNow,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(parseApiMessage(payload) || "Failed to create event.");
        return;
      }

      setSuccess(publishNow ? "Event published successfully." : "Draft saved successfully.");
      router.push("/dashboard/organizer/manage-events");
      router.refresh();
    } catch {
      setError("Unable to connect to backend.");
    } finally {
      setSubmittingMode(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
          <p className="mt-1 text-muted-foreground">
            Submit a new event proposal for CUET Carnival participants.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
            <CardDescription>
              Fill out the details required to publish your event. Drafts remain visible only in your organizer dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitEvent(true);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input
                    id="eventTitle"
                    placeholder="Enter event name"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Tech, Cultural, Workshop..."
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSeats">Maximum Seats</Label>
                  <Input
                    id="maxSeats"
                    type="number"
                    min="1"
                    placeholder="e.g. 200"
                    value={capacity}
                    onChange={(event) => setCapacity(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    placeholder="Event venue"
                    value={venue}
                    onChange={(event) => setVenue(event.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Describe event goals, rules, and agenda"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {success ? <p className="text-sm text-green-600">{success}</p> : null}
              <p className="text-xs text-muted-foreground">
                Only published events appear on Home and Events pages. Save as draft if you want to publish later.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submittingMode !== null}>
                  {submittingMode === "publish" ? "Publishing..." : "Publish Event"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submittingMode !== null}
                  onClick={() => void submitEvent(false)}
                >
                  {submittingMode === "draft" ? "Saving..." : "Save as Draft"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
