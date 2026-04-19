"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type AdminReportCard = {
  title: string;
  value: string;
  note: string;
};

type AdminReportsData = {
  reportCards: AdminReportCard[];
  insights: string[];
};

export default function AdminReportsPage() {
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminReports = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/admin/reports`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Admin access required.");
        } else if (response.status === 401) {
          setError("Please login first.");
        } else {
          setError("Failed to load reports.");
        }
        setData(null);
        return;
      }

      const payload = (await response.json()) as { data?: AdminReportsData };
      setData(payload.data ?? null);
      setError(null);
    } catch {
      setError("Unable to connect to dashboard service.");
      setData(null);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAdminReports();

    const pollId = window.setInterval(() => {
      void loadAdminReports(true);
    }, 30000);

    const handleWindowFocus = () => {
      void loadAdminReports(true);
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadAdminReports]);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="mt-1 text-muted-foreground">Analyze participation, performance, and operational outcomes.</p>
            {isLoading ? <p className="mt-2 text-sm text-muted-foreground">Loading reports...</p> : null}
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void loadAdminReports()} disabled={isLoading}>
              Refresh
            </Button>
            <Button variant="outline">Generate Monthly Report</Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.reportCards ?? []).map((item) => (
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

        {!isLoading && !error && (data?.reportCards?.length ?? 0) === 0 ? (
          <Card className="mb-8">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No report metrics available yet.
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Insights Snapshot</CardTitle>
            <CardDescription>High-level patterns from registration and attendance data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {(data?.insights ?? []).map((insight) => (
                <div key={insight} className="rounded-lg border p-3">{insight}</div>
              ))}
              {!isLoading && !error && (data?.insights?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No insights available yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
