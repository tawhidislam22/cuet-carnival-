import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const organizerStats = [
  { label: "Total Created Events", value: "7" },
  { label: "Published Events", value: "5" },
  { label: "Total Registrations", value: "1,248" },
  { label: "Pending Tasks", value: "6" },
];

const myEvents = [
  {
    id: 1,
    title: "Inter-University Startup Pitch",
    date: "May 05, 2026",
    venue: "Seminar Hall",
    status: "Published",
    registrations: 180,
  },
  {
    id: 2,
    title: "Creative Poster Design Contest",
    date: "May 08, 2026",
    venue: "Architecture Gallery",
    status: "Draft",
    registrations: 0,
  },
  {
    id: 3,
    title: "Campus Open Mic Night",
    date: "May 10, 2026",
    venue: "Main Stage",
    status: "Published",
    registrations: 312,
  },
];

export default function OrganizerDashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Create your events, monitor registrations, and manage operations from one place.
            </p>
          </div>
          <Link href="/dashboard/organizer/create-event">
            <Button>Create New Event</Button>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {organizerStats.map((item) => (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>My Event Portfolio</CardTitle>
                <CardDescription>Quick overview of events you are managing.</CardDescription>
              </div>
              <Link href="/dashboard/organizer/manage-events">
                <Button variant="outline" size="sm">Manage All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.date} • {event.venue}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${event.status === "Published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {event.status}
                      </span>
                      <span className="text-muted-foreground">Regs: {event.registrations}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
