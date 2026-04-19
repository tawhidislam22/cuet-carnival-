"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";

export default function AdminSettingsPage() {
  const [maxParticipants, setMaxParticipants] = useState("300");
  const [registrationCutoff, setRegistrationCutoff] = useState("24");
  const [requireApproval, setRequireApproval] = useState(true);
  const [allowDuplicateCheck, setAllowDuplicateCheck] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  const [savingEvent, setSavingEvent] = useState(false);
  const [savingModeration, setSavingModeration] = useState(false);
  const [eventMsg, setEventMsg] = useState<string | null>(null);
  const [moderationMsg, setModerationMsg] = useState<string | null>(null);

  const handleSaveEventSettings = async () => {
    setSavingEvent(true);
    setEventMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/admin/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultMaxParticipants: Number(maxParticipants), registrationCutoffHours: Number(registrationCutoff) }),
      });
      setEventMsg(res.ok ? "Event settings saved." : "Failed to save. Please try again.");
    } catch {
      setEventMsg("Unable to connect to server.");
    } finally {
      setSavingEvent(false);
    }
  };

  const handleUpdateModeration = async () => {
    setSavingModeration(true);
    setModerationMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/admin/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireApproval, allowDuplicateCheck, dailyDigest }),
      });
      setModerationMsg(res.ok ? "Moderation rules updated." : "Failed to update. Please try again.");
    } catch {
      setModerationMsg("Unable to connect to server.");
    } finally {
      setSavingModeration(false);
    }
  };

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
                  <Input id="maxParticipants" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} type="number" min="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Cutoff (Hours)</Label>
                  <Input id="registrationDeadline" value={registrationCutoff} onChange={(e) => setRegistrationCutoff(e.target.value)} type="number" min="0" />
                </div>
              </div>
              {eventMsg ? <p className="mt-3 text-sm text-muted-foreground">{eventMsg}</p> : null}
              <div className="mt-4">
                <Button onClick={() => void handleSaveEventSettings()} disabled={savingEvent}>
                  {savingEvent ? "Saving..." : "Save Event Settings"}
                </Button>
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
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} className="h-4 w-4" />
                  <span>Require admin approval before publishing new events</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input type="checkbox" checked={allowDuplicateCheck} onChange={(e) => setAllowDuplicateCheck(e.target.checked)} className="h-4 w-4" />
                  <span>Flag duplicate participant registrations automatically</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input type="checkbox" checked={dailyDigest} onChange={(e) => setDailyDigest(e.target.checked)} className="h-4 w-4" />
                  <span>Send daily digest to organizers</span>
                </label>
              </div>
              {moderationMsg ? <p className="mt-3 text-sm text-muted-foreground">{moderationMsg}</p> : null}
              <div className="mt-4">
                <Button variant="outline" onClick={() => void handleUpdateModeration()} disabled={savingModeration}>
                  {savingModeration ? "Updating..." : "Update Moderation Rules"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
