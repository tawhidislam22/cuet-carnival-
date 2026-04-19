"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { getAuthSession } from "@/lib/auth-client";

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

type RegistrationForm = {
  name: string;
  email: string;
  studentId: string;
  department: string;
  hall: string;
};

const CUET_EMAIL_REGEX = /^u\d{7}@student\.cuet\.ac\.bd$/i;
const CUET_EMAIL_HINT = "u2204076@student.cuet.ac.bd";

function isCuetEmail(email: string) {
  return CUET_EMAIL_REGEX.test(email.trim());
}

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

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl border bg-background shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export default function EventDetailsPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState<RegistrationForm>({
    name: "",
    email: "",
    studentId: "",
    department: "",
    hall: "",
  });

  // Auto-fill name+email from session
  useEffect(() => {
    async function prefillFromSession() {
      try {
        const session = await getAuthSession();
        const user = session?.user;
        if (user) {
          setCurrentUserId(user.id ?? null);
          setForm((prev) => ({
            ...prev,
            name: user.name ?? prev.name,
            email: user.email ?? prev.email,
          }));
        }
      } catch {
        // Ignore
      }
    }
    void prefillFromSession();
  }, []);

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

  const openModal = () => {
    setFormError(null);
    setRegisterMessage(null);
    setRegisterError(null);
    setShowModal(true);
  };

  const handleFormChange = (field: keyof RegistrationForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = form.email.trim();
    const trimmedStudentId = form.studentId.trim();
    const trimmedDept = form.department.trim();
    const trimmedHall = form.hall.trim();
    const trimmedName = form.name.trim();

    if (!trimmedName) { setFormError("Name is required."); return; }
    if (!trimmedEmail) { setFormError("Email is required."); return; }
    if (!isCuetEmail(trimmedEmail)) {
      setFormError(`Only CUET student emails are allowed (e.g. ${CUET_EMAIL_HINT})`);
      return;
    }
    if (!trimmedStudentId) { setFormError("Student ID is required."); return; }
    if (!trimmedDept) { setFormError("Department is required."); return; }
    if (!trimmedHall) { setFormError("Hall name is required."); return; }

    if (!eventId || isRegistering) return;

    setIsRegistering(true);
    setFormError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: trimmedStudentId,
          department: trimmedDept,
          hall: trimmedHall,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRegisterError(payload?.message || "Registration failed");
        setShowModal(false);
        return;
      }

      setRegisterMessage(payload?.message || "Registered successfully!");
      setEvent((prev) => (prev ? { ...prev, attendees: prev.attendees + 1 } : prev));
      setShowModal(false);
    } catch {
      setRegisterError("Something went wrong. Please try again.");
      setShowModal(false);
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
                    <Button className="sm:w-auto" onClick={openModal} disabled={isRegistering}>
                      Register Now
                    </Button>
                    <Button asChild variant="outline" className="sm:w-auto">
                      <Link href="/events">Browse More Events</Link>
                    </Button>
                    {currentUserId && event.organizer?.id === currentUserId && (
                      <Button asChild variant="outline" className="sm:w-auto">
                        <Link href={`/events/${eventId}/registrations`}>View Registrations</Link>
                      </Button>
                    )}
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

      {/* Registration Popup Modal */}
      {showModal ? (
        <Modal onClose={() => setShowModal(false)}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-1">Register for Event</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Only CUET student emails (e.g.{" "}
              <span className="font-mono">{CUET_EMAIL_HINT}</span>) are accepted.
            </p>
            <form onSubmit={(e) => void handleRegister(e)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="reg-name">Full Name</Label>
                <Input
                  id="reg-name"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-email">CUET Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  placeholder={CUET_EMAIL_HINT}
                />
                {form.email && !isCuetEmail(form.email) ? (
                  <p className="text-xs text-amber-600">Must be a CUET student email</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-student-id">Student ID</Label>
                <Input
                  id="reg-student-id"
                  value={form.studentId}
                  onChange={(e) => handleFormChange("studentId", e.target.value)}
                  placeholder="e.g. 2204076"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-dept">Department</Label>
                <Input
                  id="reg-dept"
                  value={form.department}
                  onChange={(e) => handleFormChange("department", e.target.value)}
                  placeholder="e.g. CSE, EEE, CE..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-hall">Hall</Label>
                <Input
                  id="reg-hall"
                  value={form.hall}
                  onChange={(e) => handleFormChange("hall", e.target.value)}
                  placeholder="e.g. Shahid Ziaur Rahman Hall"
                />
              </div>

              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isRegistering} className="flex-1">
                  {isRegistering ? "Registering..." : "Confirm Registration"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={isRegistering}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      ) : null}
    </PrivateRoute>
  );
}
