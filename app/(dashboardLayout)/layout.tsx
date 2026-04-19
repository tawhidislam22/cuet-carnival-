"use client";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import {
  type CurrentUserProfile,
  getCurrentUserProfile,
  needsOrganizerOnboarding,
} from "@/lib/auth-client";

export default function DashboardLayout({
  user,
  admin,
}: {
  user: React.ReactNode;
  admin: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isOnboardingRoute = pathname.startsWith("/dashboard/onboarding");
  const [isRoutingReady, setIsRoutingReady] = useState(false);
  const [profile, setProfile] = useState<CurrentUserProfile>(null);

  useEffect(() => {
    async function enforceOnboardingRouting() {
      const profile = await getCurrentUserProfile();
      setProfile(profile);

      if (!profile) {
        setIsRoutingReady(true);
        return;
      }

      if (needsOrganizerOnboarding(profile) && !isOnboardingRoute) {
        router.replace("/dashboard/onboarding");
        return;
      }

      if (!needsOrganizerOnboarding(profile) && isOnboardingRoute) {
        router.replace(profile.role === "organizer" ? "/dashboard/organizer" : "/dashboard");
        return;
      }

      if (profile.role === "admin" && !isAdminRoute) {
        router.replace("/dashboard/admin");
        return;
      }

      if (profile.role !== "admin" && isAdminRoute) {
        if (profile.role === "organizer") {
          router.replace(needsOrganizerOnboarding(profile) ? "/dashboard/onboarding" : "/dashboard/organizer");
          return;
        }

        router.replace("/dashboard");
        return;
      }

      setIsRoutingReady(true);
    }

    void enforceOnboardingRouting();
  }, [isOnboardingRoute, pathname, router]);

  return (
    <PrivateRoute>
      {!isRoutingReady ? (
        <p className="px-4 py-10 text-sm text-muted-foreground">Preparing dashboard...</p>
      ) : null}

      {isRoutingReady ? (
        <div className="flex min-h-screen">
          <DashboardSidebar organizerOnboardingLocked={needsOrganizerOnboarding(profile)} />
          <main className="flex-1 overflow-auto">
            {isAdminRoute ? admin : user}
          </main>
        </div>
      ) : null}
    </PrivateRoute>
  );
}
