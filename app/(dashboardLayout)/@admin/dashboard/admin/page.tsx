"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

type AdminOverview = {
  generatedAt?: string;
  kpis: Array<{
    label: string;
    value: number;
  }>;
  recentActivity: string[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminOverview = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/admin/overview`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Admin access required.");
        } else if (response.status === 401) {
          setError("Please login first.");
        } else {
          setError("Failed to load admin overview.");
        }
        setData(null);
        return;
      }

      const payload = (await response.json()) as { data?: AdminOverview };
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

  const lastSyncedLabel = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  useEffect(() => {
    void loadAdminOverview();

    const pollId = window.setInterval(() => {
      void loadAdminOverview(true);
    }, 30000);

    const handleWindowFocus = () => {
      void loadAdminOverview(true);
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadAdminOverview]);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Central control panel for CUET Carnival operations and analytics.
            </p>
            {isLoading ? <p className="mt-2 text-sm text-muted-foreground">Loading admin dashboard...</p> : null}
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
            {!isLoading && !error && lastSyncedLabel ? (
              <p className="mt-2 text-xs text-muted-foreground">Live API sync: {lastSyncedLabel}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void loadAdminOverview()} disabled={isLoading}>
              Refresh
            </Button>
            <Link href="/events">
              <Button>Create Announcement</Button>
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.kpis ?? []).map((item) => (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl">{item.value.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {!isLoading && !error && (data?.kpis?.length ?? 0) === 0 ? (
          <Card className="mb-8">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No KPI data available yet.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from events, registrations, and approvals.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.recentActivity ?? []).map((activity) => (
                  <div key={activity} className="rounded-lg border p-3 text-sm">
                    {activity}
                  </div>
                ))}
                {!isLoading && !error && (data?.recentActivity?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activities found.</p>
                ) : null}
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
