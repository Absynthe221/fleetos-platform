"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

function devTokenEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_ENABLE_DEV_TOKEN;
  // Default to disabled unless explicitly enabled
  return v === "true" || v === "1";
}

export async function mintDevToken(role: string = "MANAGER"): Promise<string | null> {
  if (!devTokenEnabled()) return null;
  try {
    const res = await fetch(`${apiUrl()}/auth/dev-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const token = (data?.access_token as string) || "";
    if (token && typeof window !== "undefined") {
      localStorage.setItem("token", token);
      if (data?.user?.id) localStorage.setItem("userId", data.user.id);
      localStorage.setItem("role", role);
    }
    return token || null;
  } catch {
    return null;
  }
}

export async function ensureToken(requiredRole?: string): Promise<string | null> {
  const existing = (typeof window !== "undefined" && localStorage.getItem("token")) || process.env.NEXT_PUBLIC_API_TOKEN || "";
  if (existing) return existing;
  // Do NOT auto-mint unless explicitly allowed by env var
  if (devTokenEnabled()) return await mintDevToken(requiredRole || "MANAGER");
  return null;
}

export async function authHeaders(opts?: { requiredRole?: string; allowDevMint?: boolean }): Promise<HeadersInit> {
  const allow = opts?.allowDevMint === true;
  let token = (typeof window !== "undefined" && localStorage.getItem("token")) || process.env.NEXT_PUBLIC_API_TOKEN || "";
  if (!token && allow) token = (await ensureToken(opts?.requiredRole)) || "";
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
  }
}

export function isLoggedIn(): boolean {
  return typeof window !== "undefined" && !!localStorage.getItem("token");
}

export function currentRole(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("role") : null;
}

export function currentUserId(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("userId") : null;
}

export function useRequireAuth(params?: { requiredRole?: string; allowDevMint?: boolean }) {
  const router = useRouter();
  const allow = params?.allowDevMint === true;
  const role = params?.requiredRole;
  useEffect(() => {
    async function run() {
      const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";
      if (token) return;
      if (allow && devTokenEnabled()) {
        const t = await mintDevToken(role || "MANAGER");
        if (t) return;
      }
      router.push("/login");
    }
    run();
  }, [router, allow, role]);
}


