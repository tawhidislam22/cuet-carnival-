import { AUTH_BASE_URL } from "@/lib/auth-endpoint";
import { API_BASE_URL } from "@/lib/api";

export type AuthSession = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  session?: unknown;
} | null;

export type CurrentUserProfile = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  onboardingCompleted?: boolean;
  organizerClubName?: string | null;
  organizerBio?: string | null;
  organizerEventType?: string | null;
} | null;

export function needsOrganizerOnboarding(profile: CurrentUserProfile): boolean {
  return Boolean(profile?.role === "organizer" && !profile?.onboardingCompleted);
}

export async function getAuthSession(): Promise<AuthSession> {
  const endpoints = ["/api/auth/get-session", "/api/auth/session"];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${AUTH_BASE_URL}${endpoint}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json().catch(() => null)) as
        | { user?: { id?: string; name?: string; email?: string }; session?: unknown }
        | null;

      if (payload?.user) {
        return payload;
      }

      if ((payload as { session?: { user?: { id?: string; name?: string; email?: string } } } | null)?.session?.user) {
        return {
          user: (payload as { session: { user: { id?: string; name?: string; email?: string } } }).session.user,
          session: (payload as { session?: unknown }).session,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function signOutAuth(): Promise<void> {
  await fetch(`${AUTH_BASE_URL}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { id: string; name: string | null; email: string; role: string } }
      | null;

    return payload?.data ?? null;
  } catch {
    return null;
  }
}
