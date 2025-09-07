"use client";
import { useEffect, useState } from "react";
import { authHeaders } from "@/lib/authClient";

export default function RecentTrucksClient() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [trucks, setTrucks] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const headers = await authHeaders({ requiredRole: 'MANAGER' });
      try {
        const res = await fetch(`${api}/trucks`, { headers });
        if (res.ok) {
          const list = await res.json();
          setCount(Array.isArray(list) ? list.length : 0);
          setTrucks(Array.isArray(list) ? list.slice(-8).reverse() : []);
        } else {
          setCount(0); setTrucks([]);
        }
      } catch {
        setCount(0); setTrucks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  if (loading) return <div className="p-4 text-[var(--muted)]">Loading…</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm text-[var(--muted)]">Total: {count} · <a className="underline" href="/trucks">View all</a></div>
      <div className="divide-y">
        {trucks.length > 0 ? trucks.map((t) => (
          <a key={t.id} href={`/trucks/${t.id}`} className="block py-3 hover:bg-[var(--muted-bg)] rounded px-2">
            <div className="font-medium">{t.plate || t.vin || t.id.slice(0,8)}</div>
            <div className="text-sm text-[var(--muted)]">VIN: {t.vin || '—'} · Year: {t.year || '—'} · Status: {t.status || '—'}</div>
          </a>
        )) : (
          <div className="p-4 text-[var(--muted)]">No trucks yet. Create one to see it here.</div>
        )}
      </div>
    </div>
  );
}


