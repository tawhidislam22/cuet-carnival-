"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAuthSession } from "@/lib/auth-client";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");

  const redirectPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

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
