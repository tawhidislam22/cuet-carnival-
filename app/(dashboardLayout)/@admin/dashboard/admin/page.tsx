import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const kpis = [
  { label: "Total Events", value: "24" },
  { label: "Total Registrations", value: "3,842" },
  { label: "Active Volunteers", value: "126" },
  { label: "Pending Approvals", value: "14" },
];

const recentActivities = [
  "CodeStorm Hackathon updated by Event Team",
  "128 new registrations in last 24 hours",
  "Photography Workshop venue changed",
  "2 certificates approved by admin",
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Central control panel for CUET Carnival operations and analytics.
            </p>
          </div>
          <Link href="/events">
            <Button>Create Announcement</Button>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((item) => (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from events, registrations, and approvals.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity} className="rounded-lg border p-3 text-sm">
                    {activity}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin operations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/dashboard/admin/events" className="block">
                  <Button variant="outline" className="w-full justify-start">Manage Events</Button>
                </Link>
                <Link href="/dashboard/admin/users" className="block">
                  <Button variant="outline" className="w-full justify-start">Review Participants</Button>
                </Link>
                <Link href="/dashboard/admin/reports" className="block">
                  <Button variant="outline" className="w-full justify-start">View Reports</Button>
                </Link>
                <Link href="/dashboard/admin/settings" className="block">
                  <Button variant="outline" className="w-full justify-start">System Settings</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
