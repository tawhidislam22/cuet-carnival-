import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateOrganizerEventPage() {
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
            <CardDescription>Fill out the details required to publish your event.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input id="eventTitle" placeholder="Enter event name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" placeholder="Tech, Cultural, Workshop..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSeats">Maximum Seats</Label>
                  <Input id="maxSeats" type="number" placeholder="e.g. 200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Date</Label>
                  <Input id="eventDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Time</Label>
                  <Input id="eventTime" type="time" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" placeholder="Event venue" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Describe event goals, rules, and agenda"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button">Publish Event</Button>
                <Button type="button" variant="outline">Save as Draft</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
