import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Update your CUET Carnival profile preferences and account options.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Keep your profile details up to date for event registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input id="studentId" defaultValue="C190401" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john.doe@cuet.ac.bd" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" defaultValue="Computer Science and Engineering" />
                </div>
              </div>
              <div className="mt-4">
                <Button>Save Profile Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you receive event updates and reminders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <span>Email alerts for event schedule changes</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <span>Reminders one day before registered events</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="checkbox" className="h-4 w-4" />
                  <span>Marketing updates and featured events</span>
                </label>
              </div>
              <div className="mt-4">
                <Button variant="outline">Update Notification Settings</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy and Security</CardTitle>
              <CardDescription>
                Manage your password and account visibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" placeholder="Enter current password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" placeholder="Enter new password" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button>Change Password</Button>
                <Button variant="destructive">Deactivate Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
