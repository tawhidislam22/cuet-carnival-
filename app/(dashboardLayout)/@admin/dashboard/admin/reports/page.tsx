import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const reportCards = [
  { title: "Registration Growth", value: "+18%", note: "Compared to last carnival cycle" },
  { title: "Attendance Ratio", value: "76%", note: "Average participation across all events" },
  { title: "Certificate Issuance", value: "1,245", note: "Generated and verified certificates" },
  { title: "Revenue", value: "BDT 4.8L", note: "Ticketing and sponsorship combined" },
];

export default function AdminReportsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="mt-1 text-muted-foreground">Analyze participation, performance, and operational outcomes.</p>
          </div>
          <Button variant="outline">Generate Monthly Report</Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportCards.map((item) => (
            <Card key={item.title}>
              <CardHeader className="pb-2">
                <CardDescription>{item.title}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Insights Snapshot</CardTitle>
            <CardDescription>High-level patterns from registration and attendance data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border p-3">Top category by enrollment: Technical events (41%).</div>
              <div className="rounded-lg border p-3">Peak signup period: 8 PM to 11 PM.</div>
              <div className="rounded-lg border p-3">Most engaged departments: CSE, EEE, CE.</div>
              <div className="rounded-lg border p-3">Drop-off risk is highest for multi-day events after day 1.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
