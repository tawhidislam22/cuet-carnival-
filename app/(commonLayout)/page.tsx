"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  status: string;
  category: string;
  imageUrl: string | null;
  attendees: number;
  capacity: number;
  organizer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

const categoryVisuals: Record<string, { imageUrl: string; subtitle: string }> = {
  cultural: {
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
    subtitle: "Concerts, Drama, Performances",
  },
  sports: {
    imageUrl: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1200&q=80",
    subtitle: "Football, Cricket, Indoor Games",
  },
  workshop: {
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80",
    subtitle: "Hands-on Learning Sessions",
  },
  seminar: {
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80",
    subtitle: "Talks, Panels, Knowledge Share",
  },
  technology: {
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    subtitle: "Hackathons, Coding, Innovation",
  },
  music: {
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80",
    subtitle: "Bands, Open Mic, Jamming",
  },
};

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch(`${API_BASE_URL}/events`, { cache: "no-store" });
        const payload = await response.json();
        setEvents(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadEvents();
  }, []);

  const carouselEvents = useMemo(() => events.slice(0, 4), [events]);
  const runningEvents = useMemo(() => events.slice(0, 4), [events]);
  const eventCategories = useMemo(() => {
    const categoryCount = events.reduce<Record<string, number>>((acc, event) => {
      const normalized = (event.category || "General").trim().toLowerCase();
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {});

    const mapped = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([key, count]) => {
        const displayName = key.charAt(0).toUpperCase() + key.slice(1);
        const visual = categoryVisuals[key] || {
          imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
          subtitle: `${count} events available`,
        };

        return {
          key,
          displayName,
          count,
          imageUrl: visual.imageUrl,
          subtitle: visual.subtitle,
        };
      });

    if (mapped.length > 0) {
      return mapped;
    }

    return [
      {
        key: "cultural",
        displayName: "Cultural",
        count: 0,
        imageUrl: categoryVisuals.cultural.imageUrl,
        subtitle: categoryVisuals.cultural.subtitle,
      },
      {
        key: "sports",
        displayName: "Sports",
        count: 0,
        imageUrl: categoryVisuals.sports.imageUrl,
        subtitle: categoryVisuals.sports.subtitle,
      },
      {
        key: "workshop",
        displayName: "Workshop",
        count: 0,
        imageUrl: categoryVisuals.workshop.imageUrl,
        subtitle: categoryVisuals.workshop.subtitle,
      },
      {
        key: "seminar",
        displayName: "Seminar",
        count: 0,
        imageUrl: categoryVisuals.seminar.imageUrl,
        subtitle: categoryVisuals.seminar.subtitle,
      },
    ];
  }, [events]);
  const featuredOrganizers = useMemo(() => {
    const organizerMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        hostedEvents: number;
        totalAttendees: number;
      }
    >();

    for (const event of events) {
      const organizerId = event.organizer?.id;
      if (!organizerId) {
        continue;
      }

      const organizerName = event.organizer?.name || event.organizer?.email || "Organizer";
      const organizerEmail = event.organizer?.email || "";

      const existing = organizerMap.get(organizerId);
      if (existing) {
        existing.hostedEvents += 1;
        existing.totalAttendees += event.attendees || 0;
      } else {
        organizerMap.set(organizerId, {
          id: organizerId,
          name: organizerName,
          email: organizerEmail,
          hostedEvents: 1,
          totalAttendees: event.attendees || 0,
        });
      }
    }

    return Array.from(organizerMap.values())
      .sort((a, b) => {
        if (b.hostedEvents === a.hostedEvents) {
          return b.totalAttendees - a.totalAttendees;
        }
        return b.hostedEvents - a.hostedEvents;
      })
      .slice(0, 3);
  }, [events]);
  const heroSlides = useMemo(
    () =>
      carouselEvents.length > 0
        ? carouselEvents.map((event) => ({
            id: event.id,
            imageUrl: event.imageUrl,
          }))
        : [
            {
              id: "fallback",
              imageUrl:
                "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80",
            },
          ],
    [carouselEvents]
  );

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const intervalId = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [heroSlides.length]);

  const currentHeroImage =
    heroSlides[heroIndex]?.imageUrl ||
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&q=80";

  const goToPreviousHeroImage = () => {
    setHeroIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const goToNextHeroImage = () => {
    setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const formatDuration = (startsAt: string, endsAt: string) => {
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return "TBA";
    }

    const totalMinutes = Math.round((end - start) / 60000);
    if (totalMinutes >= 60) {
      const hours = Math.round((totalMinutes / 60) * 10) / 10;
      return `${hours} hr`;
    }

    return `${totalMinutes} min`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with rotating background image */}
      <section className="relative w-full">
        <div className="relative h-[380px] md:h-[460px] overflow-hidden">
          <img
            src={currentHeroImage}
            alt="CUET Carnival Hero"
            className="w-full h-full object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-black/35" />

          {heroSlides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goToPreviousHeroImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-110 hover:bg-white/35 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)] active:scale-95"
                aria-label="Previous background image"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={goToNextHeroImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-110 hover:bg-white/35 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)] active:scale-95"
                aria-label="Next background image"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </>
          ) : null}

          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="text-center max-w-4xl text-white">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                Welcome to CUET Carnival
              </h1>
              <p className="text-lg md:text-2xl text-white/90 mb-6">
                Discover, Register, and Participate in Amazing University Events
              </p>

              <h2 className="text-2xl md:text-3xl font-semibold mb-2">Find Your Event</h2>
              <p className="text-base md:text-lg text-white/90 mb-5">
                Explore all upcoming events and join the ones you love.
              </p>
              <Link href="/events">
                <Button size="lg" className="px-8">Go to Events Page</Button>
              </Link>
            </div>
          </div>

          {heroSlides.length > 1 ? (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-2 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setHeroIndex(index)}
                  className={
                    index === heroIndex
                      ? "h-2.5 w-9 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-[0_0_0_2px_rgba(255,255,255,0.55)] transition-all duration-300"
                      : "h-2.5 w-2.5 rounded-full bg-white/85 transition-all duration-300 hover:scale-125 hover:bg-white"
                  }
                  aria-label={`Go to background image ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Event Categories Section */}
      <section className="py-14 px-4 bg-muted/25">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Event Categories</h2>
            <p className="text-muted-foreground mt-2">Explore our popular campus categories</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {eventCategories.map((category) => (
              <Link
                key={category.key}
                href={`/events?category=${encodeURIComponent(category.key)}`}
                className="group relative h-60 rounded-2xl overflow-hidden block"
              >
                <img
                  src={category.imageUrl}
                  alt={category.displayName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-2xl font-semibold leading-tight">{category.displayName}</h3>
                  <p className="text-sm text-white/90 mt-1">{category.subtitle}</p>
                  {category.count > 0 ? (
                    <p className="text-xs text-blue-200 mt-2 font-medium">{category.count} active events</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Organizers Section */}
      <section className="py-14 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Featured Organizers</h2>
              <p className="text-muted-foreground mt-2">Experts recognized for hosting outstanding events</p>
            </div>
            <Link href="/events" className="text-base font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View all organizers
            </Link>
          </div>

          {featuredOrganizers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredOrganizers.map((organizer) => {
                const initials = organizer.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("");

                return (
                  <div
                    key={organizer.id}
                    className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                        {initials || "OR"}
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold leading-tight">{organizer.name}</h3>
                        <p className="text-sm text-muted-foreground">{organizer.email || "Campus Organizer"}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      Hosted {organizer.hostedEvents} event{organizer.hostedEvents > 1 ? "s" : ""} with {organizer.totalAttendees} total participants.
                    </p>

                    <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      Verified Organizer
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No organizers to feature yet</h3>
              <p className="text-muted-foreground">Once events are published, top organizers will appear here automatically.</p>
            </div>
          )}
        </div>
      </section>

      {/* Running Events Section */}
      <section className="py-16 px-4 bg-muted/25">
        <div className="container mx-auto">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">Trending Events</h2>
              <p className="text-muted-foreground mt-2 text-lg">The most joined events right now</p>
            </div>
            <Link href="/events" className="hidden sm:inline-flex items-center gap-2 text-foreground hover:text-blue-600 font-semibold transition-colors">
              View all events
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {runningEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block overflow-hidden rounded-[22px] border border-[#d7dfdd] bg-[#f4f7f6] shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={event.imageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80"}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="rounded-full bg-[#edf4f1] px-3 py-1 text-xs font-semibold text-[#21493f] shadow-sm">
                      {event.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-1.5 flex items-start justify-between gap-2.5">
                    <h3 className="line-clamp-1 text-xl font-semibold leading-tight text-[#071c2a]">
                      {event.title}
                    </h3>
                    <span className="shrink-0 text-[1.35rem] font-bold text-[#0f5b45]">
                      ${Math.max(8, Math.min(99, Math.round(event.capacity / 2)))}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-1.5 text-xs text-[#4e6962]">
                    <span className="line-clamp-1">{event.category || "Campus Event"}</span>
                    <span>•</span>
                    <span>{formatDuration(event.startsAt, event.endsAt)}</span>
                  </div>

                  <div className="mb-3 h-px w-full bg-[#d6dfdc]" />

                  <div className="flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-lg font-semibold leading-tight text-[#071c2a]">
                        {event.organizer?.name || "Campus Organizer"}
                      </p>
                      <p className="line-clamp-1 text-xs text-[#4e6962]">{event.location}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-base font-semibold text-[#071c2a]">
                      <svg className="h-3.5 w-3.5 text-[#f4b422]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                      <span>{Math.max(4, Math.min(5, 4 + event.attendees / 100)).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {!isLoading && runningEvents.length === 0 ? (
            <p className="text-muted-foreground mt-4">No events found in database. Run backend seed.</p>
          ) : null}

          <div className="mt-6 sm:hidden">
            <Link href="/events" className="inline-flex items-center gap-2 text-foreground hover:text-blue-600 font-semibold transition-colors">
              View all events
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-muted/50 via-background to-primary/5">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              What You’ll Get Here
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide the best platform for managing and participating in university events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg">Quick Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Register for events in seconds with our streamlined process
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-purple-500/20 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg">Real-time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get instant notifications about event changes and updates
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-blue-500/20 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg">Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your data is safe with our secure platform infrastructure
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-pink-500/20 hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/10">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-600 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg">Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect with peers and build lasting campus memories
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Events Organized</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Student Clubs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-primary-foreground relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join the Carnival?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Create an account today and start exploring amazing events at CUET
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 shadow-lg hover:shadow-xl transition-shadow">
                Get Started
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10 shadow-lg hover:shadow-xl transition-all"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}