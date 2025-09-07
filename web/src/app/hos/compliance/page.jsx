"use client";
import { useEffect, useMemo, useState } from "react";
import { authHeaders } from "@/lib/authClient";
import { toast } from "react-hot-toast";

export default function HosCompliancePage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depot, setDepot] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const headers = await authHeaders({ requiredRole: 'MANAGER' });
        const res = await fetch(`${api}/driver/hos/compliance`, { headers });
        if (res.status === 403) {
          toast.error('Requires Manager or Admin role');
          setRows([]);
        } else if (res.ok) {
          setRows(await res.json());
        } else {
          setRows([]);
        }
      } catch (_) { setRows([]); }
      setLoading(false);
    })();
  }, [api]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const depotOk = !depot || r.depotId === depot;
      const qOk = !q || [r.name, r.driverId, r.truckId, r.depotName].some(v => (v || "").toLowerCase().includes(q));
      return depotOk && qOk;
    });
  }, [rows, depot, search]);

  const depots = useMemo(() => {
    const map = new Map();
    rows.forEach(r => { if (r.depotId) map.set(r.depotId, r.depotName || r.depotId); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  return (
    <main className="max-w-6xl mx-auto p-6 grid gap-4">
      <h1 className="text-xl font-semibold">HOS Compliance</h1>
      <div className="flex flex-wrap items-center gap-2">
        <select value={depot} onChange={(e)=> setDepot(e.target.value)} className="border rounded px-2 py-2 text-sm">
          <option value="">All depots</option>
          {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input value={search} onChange={(e)=> setSearch(e.target.value)} placeholder="Search driver/truck/depot" className="border rounded px-3 py-2 text-sm min-w-[240px]"/>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-12 bg-[var(--muted-bg)] rounded" />
          ))}
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Driver</th>
                <th className="py-2 pr-3">Depot</th>
                <th className="py-2 pr-3">State</th>
                <th className="py-2 pr-3">Remaining Driving</th>
                <th className="py-2 pr-3">Remaining Duty</th>
                <th className="py-2 pr-3">Truck</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const driving0 = r.remainingDrivingMins === 0;
                const duty0 = r.remainingDutyMins === 0;
                const drivingSoon = r.remainingDrivingMins > 0 && r.remainingDrivingMins <= 30;
                const dutySoon = r.remainingDutyMins > 0 && r.remainingDutyMins <= 30;
                const rowClass = driving0 || duty0 ? 'bg-red-50' : (drivingSoon || dutySoon ? 'bg-yellow-50' : '');
                return (
                <tr key={r.driverId} className={`border-b ${rowClass}`}>
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3">{r.depotName || '—'}</td>
                  <td className="py-2 pr-3">{r.state}</td>
                  <td className="py-2 pr-3">
                    {Math.floor(r.remainingDrivingMins/60)}h {r.remainingDrivingMins%60}m
                    {driving0 && <span className="ml-2 text-red-700">• limit reached</span>}
                    {drivingSoon && <span className="ml-2 text-yellow-700">• soon</span>}
                  </td>
                  <td className="py-2 pr-3">
                    {Math.floor(r.remainingDutyMins/60)}h {r.remainingDutyMins%60}m
                    {duty0 && <span className="ml-2 text-red-700">• limit reached</span>}
                    {dutySoon && <span className="ml-2 text-yellow-700">• soon</span>}
                  </td>
                  <td className="py-2 pr-3">{r.truckId ? <a className="underline" href={`/trucks/${r.truckId}`}>{r.truckId.slice(0,8)}</a> : '—'}</td>
                </tr>
              );})}
            </tbody>
          </table>
          {!filtered.length && <div className="p-4 text-[var(--muted)]">No drivers match current filters.</div>}
        </div>
      )}
    </main>
  );
}


