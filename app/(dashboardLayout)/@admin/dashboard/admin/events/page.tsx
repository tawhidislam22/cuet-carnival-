import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const events = [
  { name: "CodeStorm Hackathon", category: "Tech", date: "Apr 20, 2026", status: "Published", seats: 320 },
  { name: "Spring Concert", category: "Cultural", date: "Apr 22, 2026", status: "Published", seats: 900 },
  { name: "Robotics Contest", category: "Competition", date: "Apr 24, 2026", status: "Draft", seats: 120 },
  { name: "Photography Workshop", category: "Workshop", date: "Apr 25, 2026", status: "Published", seats: 80 },
];

export default function AdminEventsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
            <p className="mt-1 text-muted-foreground">Create, update, and monitor all carnival events.</p>
          </div>
          <Button>Add New Event</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event List</CardTitle>
            <CardDescription>All current and upcoming events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.name} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.category} • {event.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {event.status}
                      </span>
                      <span className="text-sm text-muted-foreground">Seats: {event.seats}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Registrations</Button>
                    <Button size="sm" variant="destructive">Archive</Button>
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
