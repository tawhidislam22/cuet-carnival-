import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const managedEvents = [
  {
    id: 1,
    title: "Inter-University Startup Pitch",
    date: "May 05, 2026",
    status: "Published",
    registrations: 180,
    completion: "Logistics 80%",
  },
  {
    id: 2,
    title: "Creative Poster Design Contest",
    date: "May 08, 2026",
    status: "Draft",
    registrations: 0,
    completion: "Content 40%",
  },
  {
    id: 3,
    title: "Campus Open Mic Night",
    date: "May 10, 2026",
    status: "Published",
    registrations: 312,
    completion: "Logistics 95%",
  },
];

export default function ManageOrganizerEventsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
            <p className="mt-1 text-muted-foreground">
              Maintain your published events, update schedules, and track registrations.
            </p>
          </div>
          <Link href="/dashboard/organizer/create-event">
            <Button>Create Another Event</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Maintenance Board</CardTitle>
            <CardDescription>Use actions below to keep events updated and healthy.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {managedEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.date} • {event.completion}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${event.status === "Published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {event.status}
                      </span>
                      <span className="text-sm text-muted-foreground">Regs: {event.registrations}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">Edit Details</Button>
                    <Button size="sm" variant="outline">Manage Participants</Button>
                    <Button size="sm" variant="outline">View Analytics</Button>
                    <Button size="sm" variant="destructive">Cancel Event</Button>
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
