"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_BASE_URL } from "@/lib/auth-endpoint";
import { getCurrentUserProfile } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"student" | "organizer">("student");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
          role: role === "student" ? "user" : "organizer",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        setError(payload?.message || "Registration failed. Try again.");
        return;
      }

      const profile = await getCurrentUserProfile();
      const targetPath = profile?.role === "organizer" ? "/dashboard/organizer" : "/dashboard";

      router.push(targetPath);
      router.refresh();
    } catch {
      setError("Unable to connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setIsGoogleSubmitting(true);

    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider: "google",
          disableRedirect: true,
          callbackURL: `${window.location.origin}/dashboard`,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; url?: string }
        | null;

      if (!response.ok || !payload?.url) {
        setError(payload?.message || "Google registration failed. Please try again.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setError("Unable to connect to authentication server.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your information to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">I want to join as</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    role === "student"
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  )}
                  onClick={() => setRole("student")}
                >
                  <p className="font-semibold">Student</p>
                  <p className="text-sm text-muted-foreground">Join events</p>
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    role === "organizer"
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  )}
                  onClick={() => setRole("organizer")}
                >
                  <p className="font-semibold">Organizer</p>
                  <p className="text-sm text-muted-foreground">Create events</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  placeholder="Max"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  placeholder="Robinson"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
            <Button type="submit" className="w-full">
              {isSubmitting ? "Creating account..." : "Create an account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleRegister}
              disabled={isSubmitting || isGoogleSubmitting}
            >
              {isGoogleSubmitting ? "Redirecting to Google..." : "Continue with Google"}
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
