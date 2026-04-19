"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { CuetCarnivalLogo } from "@/components/ui/cuet-carnival-logo";
import {
  getAuthSession,
  getCurrentUserProfile,
  needsOrganizerOnboarding,
  signOutAuth,
} from "@/lib/auth-client";
import type { CurrentUserProfile } from "@/lib/auth-client";

function getInitials(name: string | null | undefined, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

const AVATAR_COLORS = [
  "bg-purple-600",
  "bg-violet-600",
  "bg-indigo-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
];

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type Props = {
  /** "bottom" — popup opens downward (navbar); "top" — popup opens upward (sidebar bottom) */
  popoverSide?: "top" | "bottom";
};

export function UserAvatarMenu({ popoverSide = "bottom" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<CurrentUserProfile>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const session = await getAuthSession();
      if (!session?.user) return;
      const p = await getCurrentUserProfile();
      setProfile(p);
    }
    void loadUser();
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;

    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setOpen(false);
    await signOutAuth();
    router.push("/login");
    router.refresh();
  };

  if (!profile) return null;

  const name = profile.name ?? null;
  const email = profile.email;
  const initials = getInitials(name, email);
  const avatarColor = getAvatarColor(email || name || "CC");

  const dashboardPath =
    profile.role === "admin"
      ? "/dashboard/admin"
      : needsOrganizerOnboarding(profile)
        ? "/dashboard/onboarding"
        : profile.role === "organizer"
          ? "/dashboard/organizer"
          : "/dashboard";

  const roleLabel =
    profile.role === "admin"
      ? "Administrator"
      : profile.role === "organizer"
        ? "Organizer"
        : "Student";

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar button — opens popup */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-2 ring-offset-1 ring-offset-background ring-white/30 hover:ring-white/60 transition-all select-none ${avatarColor}`}
        aria-label="Open user menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {/* Popover */}
      {open ? (
        <div
          className={`absolute ${popoverSide === "top" ? "bottom-full mb-2 left-0" : "top-full mt-2 right-0"} w-72 min-w-64 rounded-xl border bg-popover text-popover-foreground shadow-xl z-50 overflow-hidden`}
        >
          {/* Logo + user info header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b bg-muted/30">
            <CuetCarnivalLogo size={40} className="shrink-0 rounded-lg" />
            <div className="flex-1 min-w-0">
              {name ? (
                <p className="text-sm font-semibold truncate leading-tight">{name}</p>
              ) : null}
              <p className="text-xs text-muted-foreground truncate">{email}</p>
              <span className="inline-block mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2 space-y-0.5">
            {pathname.startsWith("/dashboard") ? (
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Home
              </Link>
            ) : (
              <Link
                href={dashboardPath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
            )}

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
