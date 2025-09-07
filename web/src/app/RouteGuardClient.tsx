"use client";
import { useEffect, useMemo, useState } from "react";
import { currentRole } from "@/lib/authClient";

function getAllowedRoles(pathname: string): string[] | null {
  const driverOnly = process.env.NEXT_PUBLIC_DRIVER_ONLY === 'true';
  if (driverOnly) {
    if (pathname.startsWith('/login')) return null;
    if (pathname.startsWith('/driver/inspect') || pathname.startsWith('/driver/hos')) return ['DRIVER'];
    return ['DRIVER'];
  }
  if (pathname.startsWith("/login")) return null;
  if (pathname === "/") return ["MANAGER","ADMIN"]; // dashboard
  if (pathname.startsWith("/trucks")) return ["MANAGER","ADMIN"];
  if (pathname === "/yard/new") return ["ADMIN"];
  if (pathname.startsWith("/yard")) return ["MANAGER","ADMIN"];
  if (pathname.startsWith("/alerts")) return ["MANAGER","ADMIN"];
  if (pathname.startsWith("/hos/compliance")) return ["MANAGER","ADMIN"];
  if (pathname.startsWith("/admin")) return ["ADMIN"];
  if (pathname.startsWith("/security")) return ["SECURITY"];
  if (pathname.startsWith("/mechanic")) return ["MECHANIC"];
  if (pathname.startsWith("/driver/inspect") || pathname.startsWith("/driver/hos")) return ["DRIVER"];
  return null; // unguarded
}

export default function RouteGuardClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pathname, setPathname] = useState<string>("/");

  useEffect(() => {
    setMounted(true);
    setRole(currentRole());
    setToken(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    setPathname(typeof window !== 'undefined' ? window.location.pathname : "/");
  }, []);

  const allowed = useMemo(() => getAllowedRoles(pathname), [pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (allowed && !token) {
      window.location.assign('/login');
    }
  }, [mounted, allowed, token]);

  if (!mounted) return null;
  if (!allowed) return <>{children}</>;
  if (!token) return null;
  if (role && allowed.includes(role)) return <>{children}</>;

  return (
    <main className="p-6">
      <div className="max-w-xl mx-auto border rounded p-4">
        <div className="text-lg font-semibold mb-2">No access</div>
        <div className="text-sm text-[var(--muted)]">Your role does not have permission to view this page.</div>
        <div className="mt-3 text-sm">
          <a className="underline" href="/">Go to Dashboard</a>
        </div>
      </div>
    </main>
  );
}


