"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { getCurrentUserProfile, needsOrganizerOnboarding } from "@/lib/auth-client";

type Step = 1 | 2 | 3;

const stepTitles: Record<Step, string> = {
  1: "Organizer Profile",
  2: "Event Specialty",
  3: "Create Your First Event",
};

export default function OrganizerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clubName, setClubName] = useState("");
  const [organizerBio, setOrganizerBio] = useState("");
  const [eventType, setEventType] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    async function bootstrap() {
      const profile = await getCurrentUserProfile();

      if (!profile) {
        router.replace("/login?redirect=%2Fdashboard%2Fonboarding");
        return;
      }

      if (profile.role !== "organizer") {
        router.replace("/dashboard");
        return;
      }

      if (!needsOrganizerOnboarding(profile)) {
        router.replace("/dashboard/organizer");
        return;
      }

      setClubName(profile.organizerClubName || "");
      setOrganizerBio(profile.organizerBio || "");
      setEventType(profile.organizerEventType || "");
      setIsLoadingProfile(false);
    }

    void bootstrap();
  }, [router]);

  const progressPercent = useMemo(() => {
    return step === 1 ? 33 : step === 2 ? 66 : 100;
  }, [step]);

  const validateCurrentStep = (): string | null => {
    if (step === 1) {
      if (clubName.trim().length < 2) {
        return "Please enter your club or organizer name.";
      }

      if (organizerBio.trim().length < 10) {
        return "Please provide a short organizer bio (at least 10 characters).";
      }
    }

    if (step === 2) {
      if (eventType.trim().length < 2) {
        return "Please tell us what kind of events you organize.";
      }
    }

    if (step === 3) {
      if (
        !eventTitle.trim() ||
        !eventDescription.trim() ||
        !eventLocation.trim() ||
        !eventDate ||
        !startTime ||
        !endTime ||
        !capacity
      ) {
        return "Please fill all first-event details.";
      }

      if (eventDescription.trim().length < 10) {
        return "Event description should be at least 10 characters.";
      }

      const parsedCapacity = Number(capacity);
      if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
        return "Capacity must be a positive whole number.";
      }

      const startsAt = new Date(`${eventDate}T${startTime}`);
      const endsAt = new Date(`${eventDate}T${endTime}`);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
        return "Please provide valid start and end time.";
      }

      if (endsAt <= startsAt) {
        return "Event end time must be after start time.";
      }
    }

    return null;
  };

  const goNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev));
  };

  const goBack = () => {
    setError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const handleCompleteOnboarding = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const startsAt = new Date(`${eventDate}T${startTime}`).toISOString();
      const endsAt = new Date(`${eventDate}T${endTime}`).toISOString();

      const eventResponse = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: eventTitle.trim(),
          description: eventDescription.trim(),
          category: eventType.trim(),
          location: eventLocation.trim(),
          startsAt,
          endsAt,
          capacity: Number(capacity),
          isPublished: false,
        }),
      });

      if (!eventResponse.ok) {
        setError("Could not create first event. Please check all event details and try again.");
        return;
      }

      const onboardingResponse = await fetch(`${API_BASE_URL}/users/me/onboarding`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizerClubName: clubName.trim(),
          organizerBio: organizerBio.trim(),
          organizerEventType: eventType.trim(),
        }),
      });

      if (!onboardingResponse.ok) {
        setError("Event was created, but onboarding could not be saved. Please try again.");
        return;
      }

      router.replace("/dashboard/organizer");
      router.refresh();
    } catch {
      setError("Unable to complete onboarding right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Preparing organizer onboarding...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Organizer Onboarding</h1>
          <p className="mt-2 text-muted-foreground">
            Complete onboarding to unlock organizer routes and start managing events.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{stepTitles[step]}</CardTitle>
                <CardDescription>Step {step} of 3</CardDescription>
              </div>
              <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Organizer routes locked
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {([1, 2, 3] as Step[]).map((stepItem) => {
                const isCurrent = stepItem === step;
                const isComplete = stepItem < step;

                return (
                  <div
                    key={stepItem}
                    className={[
                      "rounded-lg border p-3 text-sm",
                      isCurrent
                        ? "border-primary bg-primary/5"
                        : isComplete
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-border bg-background",
                    ].join(" ")}
                  >
                    <p className="font-medium">{stepItem}. {stepTitles[stepItem]}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Organizer Profile</CardTitle>
              <CardDescription>
                Tell participants who you are and what your organizer team does.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clubName">Club / Organizer Name</Label>
                <Input
                  id="clubName"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g. CUET Robotics Club"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizerBio">Organizer Info</Label>
                <textarea
                  id="organizerBio"
                  className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={organizerBio}
                  onChange={(e) => setOrganizerBio(e.target.value)}
                  placeholder="Briefly describe your club, mission, and organizing strengths"
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <CardHeader>
              <CardTitle>Event Specialty</CardTitle>
              <CardDescription>
                Set the event type you usually organize.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="e.g. Hackathons, Cultural Fest, Workshops"
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 3 ? (
          <form className="space-y-4" onSubmit={handleCompleteOnboarding}>
            <Card>
              <CardHeader>
                <CardTitle>Create First Event</CardTitle>
                <CardDescription>
                  Add your first event draft to finish onboarding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input
                    id="eventTitle"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. CUET Innovation Sprint"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Event Description</Label>
                  <textarea
                    id="eventDescription"
                    className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Tell participants what this event is about"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="eventLocation">Location</Label>
                    <Input
                      id="eventLocation"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="e.g. CUET Auditorium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Date</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g. 150"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button type="button" variant="outline" onClick={goBack} disabled={isSubmitting}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-44">
                {isSubmitting ? "Completing..." : "Complete Onboarding"}
              </Button>
            </div>
          </form>
        ) : null}

        {step !== 3 ? (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={goBack} disabled={step === 1}>
              Back
            </Button>
            <Button type="button" onClick={goNext} className="min-w-32">
              Next
            </Button>
          </div>
        ) : null}

        {step !== 3 && error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
