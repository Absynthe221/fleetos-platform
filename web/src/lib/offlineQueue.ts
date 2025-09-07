"use client";

import { apiUrl, authHeaders } from "@/lib/authClient";

type HttpMethod = "POST" | "PATCH" | "PUT";

export type OfflineQueueItem = {
  id: string;
  endpoint: string; // e.g. /driver/hos/state
  method: HttpMethod;
  body: any;
  requiredRole?: string;
  createdAt: number;
};

const STORAGE_KEY = "offline-queue-v1";
let started = false;

function load(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: OfflineQueueItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function enqueue(item: Omit<OfflineQueueItem, "id" | "createdAt">) {
  const items = load();
  items.push({ ...item, id: crypto.randomUUID(), createdAt: Date.now() });
  save(items);
}

export async function processQueue(): Promise<{ processed: number; remaining: number }> {
  const items = load();
  if (!items.length) return { processed: 0, remaining: 0 };
  const api = apiUrl();
  const keep: OfflineQueueItem[] = [];
  let okCount = 0;

  for (const it of items) {
    try {
      const baseHeaders: any = { "Content-Type": "application/json" };
      let headers: any = baseHeaders;
      if (it.requiredRole) {
        headers = await authHeaders({ requiredRole: it.requiredRole });
      }
      const res = await fetch(`${api}${it.endpoint}`, {
        method: it.method,
        headers,
        body: JSON.stringify(it.body),
      });
      if (!res.ok) {
        // Keep for retry on transient errors; drop on 4xx except 429
        if (res.status >= 500 || res.status === 429) keep.push(it);
      } else {
        okCount += 1;
      }
    } catch {
      keep.push(it);
    }
  }

  save(keep);
  return { processed: okCount, remaining: keep.length };
}

export function startAutoSync(intervalMs: number = 15000) {
  if (started) return;
  started = true;
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => { processQueue(); });
    setInterval(() => { if (navigator.onLine) processQueue(); }, intervalMs);
  }
}


