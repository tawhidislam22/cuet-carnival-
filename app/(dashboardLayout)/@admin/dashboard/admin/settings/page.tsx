import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="mt-1 text-muted-foreground">Configure platform-wide options for CUET Carnival operations.</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Configuration</CardTitle>
              <CardDescription>Global controls for event registrations and publication flow.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Default Max Participants</Label>
                  <Input id="maxParticipants" defaultValue="300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Cutoff (Hours)</Label>
                  <Input id="registrationDeadline" defaultValue="24" />
                </div>
              </div>
              <div className="mt-4">
                <Button>Save Event Settings</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation Controls</CardTitle>
              <CardDescription>Automated moderation and manual review options.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <span>Require admin approval before publishing new events</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <span>Flag duplicate participant registrations automatically</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="checkbox" className="h-4 w-4" />
                  <span>Send daily digest to organizers</span>
                </label>
              </div>
              <div className="mt-4">
                <Button variant="outline">Update Moderation Rules</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
