"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type EventItem = {
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
};

export default function EventsPage() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") || "all").trim().toLowerCase();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const queryCategory = (searchParams.get("category") || "all").trim().toLowerCase();
    setSelectedCategory(queryCategory || "all");
  }, [searchParams]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch(`${API_BASE_URL}/events`, { cache: "no-store" });
        const payload = await response.json();
        setAllEvents(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setAllEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadEvents();
  }, []);

  const categories = useMemo(() => {
    const fromEvents = Array.from(
      new Set(allEvents.map((event) => event.category?.trim().toLowerCase()))
    ).filter(Boolean) as string[];
    return ["all", ...fromEvents];
  }, [allEvents]);

  const formatDateTime = (date: string) => {
    const parsed = new Date(date);
    return {
      date: parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
  };

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const eventCategory = (event.category || "").trim().toLowerCase();
    const matchesCategory = selectedCategory === "all" || eventCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">All Events</h1>
          <p className="text-muted-foreground">
            Discover and register for upcoming university events
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} of {allEvents.length} events
          </p>
          {isLoading ? <p className="text-sm text-muted-foreground mt-1">Loading events...</p> : null}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvents.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="block">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                    src={event.imageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80"}
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    {event.status}
                  </span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    {event.category}
                  </span>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateTime(event.startsAt).date} at {formatDateTime(event.startsAt).time}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {event.attendees}/{event.capacity} Registered
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <span>View Details</span>
                </Button>
              </CardFooter>
            </Card>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
