"use client";
import { useEffect, useState } from "react";
import { authHeaders } from "@/lib/authClient";

export default function TruckDetailPage({ params }) {
  const { id } = params || {};
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const headers = await authHeaders({ requiredRole: 'MANAGER' });
      try {
        const res = await fetch(`${api}/trucks/${id}`, { headers });
        setTruck(res.ok ? await res.json() : null);
      } catch { setTruck(null); }
      setLoading(false);
    })();
  }, [api, id]);

  if (!id) return <main className="max-w-4xl mx-auto p-6">Invalid truck id</main>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      {loading ? <div>Loading…</div> : !truck ? <div>Truck not found.</div> : (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">{truck.name || truck.plate || truck.vin || id.slice(0,8)}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border rounded p-3"><div className="text-sm text-[var(--muted)]">Name</div><div className="font-medium">{truck.name || '—'}</div></div>
            <div className="border rounded p-3"><div className="text-sm text-[var(--muted)]">VIN</div><div className="font-medium">{truck.vin || '—'}</div></div>
            <div className="border rounded p-3"><div className="text-sm text-[var(--muted)]">Year</div><div className="font-medium">{truck.year || '—'}</div></div>
            <div className="border rounded p-3"><div className="text-sm text-[var(--muted)]">Status</div><div className="font-medium">{truck.status || '—'}</div></div>
            <div className="border rounded p-3"><div className="text-sm text-[var(--muted)]">Depot</div><div className="font-medium">{truck.depot?.name || '—'}</div></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <div>
              <h2 className="font-medium mb-2">QR</h2>
              <img src={`${api}/trucks/${id}/qr`} alt="QR" className="border rounded" />
            </div>
            <div>
              <h2 className="font-medium mb-2">Barcode</h2>
              <img src={`${api}/trucks/${id}/barcode`} alt="Barcode" className="border rounded bg-white" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


