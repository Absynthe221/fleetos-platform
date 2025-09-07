"use client";
import { useEffect, useMemo, useState } from "react";
import { authHeaders, currentRole } from "@/lib/authClient";
import { toast } from "react-hot-toast";

export default function TrucksListPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [visible, setVisible] = useState({ vin: true, year: true, status: true });
  const [role, setRole] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const headers = await authHeaders({ requiredRole: 'MANAGER' });
      try {
        const res = await fetch(`${api}/trucks`, { headers });
        const data = res.ok ? await res.json() : [];
        setRows(Array.isArray(data) ? data : []);
      } catch { setRows([]); }
      setLoading(false);
    })();
  }, [api]);

  useEffect(() => {
    setRole(currentRole());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((t) => {
      const matchesQuery = !q || [t.name, t.plate, t.vin, t.id]?.some(v => (v || "").toLowerCase().includes(q));
      const matchesStatus = !status || (t.status || "").toLowerCase() === status.toLowerCase();
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, status]);

  async function downloadCsv() {
    try {
      const headers = await authHeaders({ requiredRole: 'FLEET_MANAGER' });
      const res = await fetch(`${api}/reports/trucks.csv`, { headers });
      if (res.status === 403) {
        toast.error("Requires Admin or Fleet Manager role");
        return;
      }
      if (!res.ok) throw new Error("Failed to export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trucks.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Export failed");
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Trucks</h1>
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name/plate/VIN/ID"
          className="border rounded px-3 py-2 text-sm min-w-[220px]"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={visible.vin} onChange={(e)=>setVisible(v=>({...v, vin:e.target.checked}))}/> VIN</label>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={visible.year} onChange={(e)=>setVisible(v=>({...v, year:e.target.checked}))}/> Year</label>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={visible.status} onChange={(e)=>setVisible(v=>({...v, status:e.target.checked}))}/> Status</label>
          <button
            onClick={downloadCsv}
            disabled={!(role === 'ADMIN' || role === 'FLEET_MANAGER')}
            title={!(role === 'ADMIN' || role === 'FLEET_MANAGER') ? 'Requires Admin or Fleet Manager' : undefined}
            className="border rounded px-3 py-2 text-sm disabled:opacity-50 hover:bg-[var(--muted-bg)]"
          >
            Export CSV
          </button>
          <button disabled className="border rounded px-3 py-2 text-sm opacity-50" title="PDF export coming soon">
            Export PDF
          </button>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-12 bg-[var(--muted-bg)] rounded" />
          ))}
        </div>
      ) : (
        <div className="divide-y">
          {filtered.length ? filtered.map((t) => (
            <a key={t.id} href={`/trucks/${t.id}`} className="flex items-center justify-between py-3 hover:bg-[var(--muted-bg)] rounded px-2">
              <div className="grid gap-1">
                <div className="font-medium">{t.name || t.plate || t.vin || t.id.slice(0,8)}</div>
                <div className="text-sm text-[var(--muted)]">
                  {visible.vin && <span>VIN: {t.vin || '—'} </span>}
                  {visible.year && <span>· Year: {t.year || '—'} </span>}
                  {visible.status && <span>· Status: {t.status || '—'}</span>}
                </div>
              </div>
            </a>
          )) : <div className="p-4 text-[var(--muted)]">No trucks match your filters.</div>}
        </div>
      )}
    </main>
  );
}


