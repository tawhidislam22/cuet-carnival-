"use client";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { usePathname } from "next/navigation";
import { PrivateRoute } from "@/components/auth/PrivateRoute";

export default function DashboardLayout({
  user,
  admin,
}: {
  user: React.ReactNode;
  admin: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/dashboard/admin");

  return (
    <PrivateRoute>
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {isAdminRoute ? admin : user}
        </main>
      </div>
    </PrivateRoute>
  );
}
