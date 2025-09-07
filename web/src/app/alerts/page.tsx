"use client";
import { useEffect, useState } from "react";
import { authHeaders, useRequireAuth } from "@/lib/authClient";

export default function AlertsPage() {
  useRequireAuth('MANAGER');
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const [data, setData] = useState<any>({ expiringDocs: [], failingInspections: [], upcomingMaintenance: [], recentSecurity: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const headers = await authHeaders({ requiredRole: 'MANAGER' });
      const r = await fetch(`${api}/alerts`, { headers });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e: any) {
      setError(e?.message || 'Failed to load alerts');
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); const id = setInterval(load, 15000); return ()=> clearInterval(id); }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 grid gap-6">
      <h1 className="text-xl font-semibold">Alerts Center</h1>
      {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="font-medium mb-2">Expiring Documents (≤ 30 days)</div>
          <ul className="text-sm space-y-1 max-h-64 overflow-auto">
            {(data.expiringDocs||[]).map((d:any)=> (
              <li key={d.id}>{d.type} · {d.truck?.plate || d.truckId} · {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : ''}</li>
            ))}
          </ul>
        </div>
        <div className="border rounded p-4">
          <div className="font-medium mb-2">Failed Inspections</div>
          <ul className="text-sm space-y-1 max-h-64 overflow-auto">
            {(data.failingInspections||[]).map((i:any)=> (
              <li key={i.id}>{i.truck?.plate || i.truckId} · {i.inspectionType} · {new Date(i.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
        <div className="border rounded p-4">
          <div className="font-medium mb-2">Upcoming Maintenance</div>
          <ul className="text-sm space-y-1 max-h-64 overflow-auto">
            {(data.upcomingMaintenance||[]).map((m:any)=> (
              <li key={m.id}>{m.truck?.plate || m.truckId} · {m.type} · next {m.nextServiceDate ? new Date(m.nextServiceDate).toLocaleDateString() : ''}</li>
            ))}
          </ul>
        </div>
        <div className="border rounded p-4">
          <div className="font-medium mb-2">Recent Security Events</div>
          <ul className="text-sm space-y-1 max-h-64 overflow-auto">
            {(data.recentSecurity||[]).map((g:any)=> (
              <li key={g.id}>{g.action} · {g.truckId} · {new Date(g.timestamp).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}


