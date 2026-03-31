import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const participants = [
  { name: "Arafat Rahman", dept: "CSE", studentId: "C200101", events: 4, status: "Active" },
  { name: "Nadia Sultana", dept: "EEE", studentId: "E200089", events: 2, status: "Active" },
  { name: "Shafin Ahmed", dept: "ME", studentId: "M190245", events: 1, status: "Flagged" },
  { name: "Tasnia Islam", dept: "CE", studentId: "CE210044", events: 3, status: "Active" },
];

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
            <p className="mt-1 text-muted-foreground">Review participant activity, status, and enrollment details.</p>
          </div>
          <Button variant="outline">Export CSV</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Participant Directory</CardTitle>
            <CardDescription>Latest participant records from registration data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.map((user) => (
                <div key={user.studentId} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.dept} • {user.studentId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Events: {user.events}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">View Profile</Button>
                    <Button size="sm" variant="outline">Message</Button>
                    <Button size="sm" variant="destructive">Suspend</Button>
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
