"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { CuetCarnivalLogo } from "@/components/ui/cuet-carnival-logo";
import { UserAvatarMenu } from "@/components/ui/user-avatar-menu";
import { getAuthSession } from "@/lib/auth-client";

export function Navbar() {
  const pathname = usePathname();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Events", href: "/events" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contract" },
  ];

  useEffect(() => {
    async function loadSession() {
      const session = await getAuthSession();
      setIsAuthenticated(Boolean(session?.user));
      setIsAuthLoading(false);
    }
    void loadSession();
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <CuetCarnivalLogo size={36} />
            <span className="text-xl font-bold bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden sm:block">
              CUET Carnival
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={cn(
                    "transition-colors",
                    pathname === item.href && "pointer-events-none"
                  )}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {/* Authenticated */}
            {!isAuthLoading && isAuthenticated ? (
              <>
                <UserAvatarMenu popoverSide="bottom" />
                {!pathname.startsWith("/dashboard") ? (
                  <Link href="/dashboard">
                    <Button size="sm" variant="outline">
                      Dashboard
                    </Button>
                  </Link>
                ) : null}
              </>
            ) : null}

            {/* Guest */}
            {!isAuthLoading && !isAuthenticated ? (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Register</Button>
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
