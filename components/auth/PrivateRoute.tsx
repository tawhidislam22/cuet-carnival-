"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/auth-client";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");

  const redirectPath = useMemo(() => {
    if (typeof window === "undefined") {
      return pathname;
    }

    const search = window.location.search || "";

    if (!search) {
      return pathname;
    }

    return `${pathname}${search}`;
  }, [pathname]);

  useEffect(() => {
    async function verifySession() {
      const session = await getAuthSession();

      if (!session?.user) {
        setAuthStatus("unauthorized");
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      setAuthStatus("authorized");
    }

    void verifySession();
  }, [redirectPath, router]);

  if (authStatus === "checking") {
    return <p className="px-4 py-10 text-sm text-muted-foreground">Checking authentication...</p>;
  }

  if (authStatus === "unauthorized") {
    return null;
  }

  return <>{children}</>;
}
