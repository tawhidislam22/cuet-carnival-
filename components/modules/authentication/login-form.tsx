"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_BASE_URL } from "@/lib/auth-endpoint";
import { getCurrentUserProfile, needsOrganizerOnboarding } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      setNotice("Email verified successfully. Your account is now active.");
      return;
    }

    if (params.get("registered") === "1") {
      const email = params.get("email");
      setNotice(
        email
          ? `Verification email sent to ${email}. Please verify your email before logging in.`
          : "Registration successful. Please verify your email before logging in."
      );
    }
  }, []);

  const getSafeRedirectTarget = () => {
    if (typeof window === "undefined") {
      return null;
    }

    const redirectTarget = new URLSearchParams(window.location.search).get("redirect");
    return redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          callbackURL: `${window.location.origin}/login?verified=1`,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string; code?: string }
          | null;

        const isEmailNotVerified =
          payload?.code === "EMAIL_NOT_VERIFIED" ||
          /email\s+not\s+verified/i.test(payload?.message ?? "");

        if (isEmailNotVerified) {
          setError("Your email is not verified. We sent a verification link to your inbox.");
          return;
        }

        setError(payload?.message || "Login failed. Please check your credentials.");
        return;
      }

      const redirectTarget = getSafeRedirectTarget();

      let targetPath = "/dashboard";
      if (redirectTarget) {
        targetPath = redirectTarget;
      } else {
        const profile = await getCurrentUserProfile();
        if (needsOrganizerOnboarding(profile)) {
          targetPath = "/dashboard/onboarding";
        } else if (profile?.role === "admin") {
          targetPath = "/dashboard/admin";
        } else if (profile?.role === "organizer") {
          targetPath = "/dashboard/organizer";
        }
      }

      router.push(targetPath);
      router.refresh();
    } catch {
      setError("Unable to connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleSubmitting(true);

    try {
      const redirectTarget = getSafeRedirectTarget();
      const callbackPath =
        redirectTarget
          ? redirectTarget
          : "/dashboard";

      const response = await fetch(`${AUTH_BASE_URL}/api/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider: "google",
          disableRedirect: true,
          callbackURL: `${window.location.origin}${callbackPath}`,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; url?: string }
        | null;

      if (!response.ok || !payload?.url) {
        setError(payload?.message || "Google login failed. Please try again.");
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
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                autoComplete="off"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <Button type="submit" className="w-full">
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleSubmitting}
            >
              {isGoogleSubmitting ? "Redirecting to Google..." : "Continue with Google"}
            </Button>
          </div>
          {notice ? <p className="mt-3 text-sm text-emerald-700">{notice}</p> : null}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
